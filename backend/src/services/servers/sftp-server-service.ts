import { injectable, inject } from "tsyringe";
import ssh2 from "ssh2";
import type { AuthContext, SFTPWrapper, Attributes } from "ssh2";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { UserRepository } from "@/repositories/user-repository";
import { ServerRepository } from "@/repositories/server-repository";
import { verifyPassword } from "@/utils/password";
import { getServerDirectory } from "@/utils/server-path";

interface HandleInfo {
  fd?: number;
  dirContext?: {
    files: {
      filename: string;
      longname: string;
      attrs: Attributes;
    }[];
    index: number;
  };
}

@injectable()
export class SftpServerService {
  private server: ssh2.Server | null = null;
  private hostKey: string;
  private handles = new Map<string, HandleInfo>();

  constructor(
    @inject(UserRepository) private readonly userRepository: UserRepository,
    @inject(ServerRepository) private readonly serverRepository: ServerRepository
  ) {
    this.hostKey = this.getOrCreateHostKey();
  }

  private getOrCreateHostKey(): string {
    const keyPath = path.resolve(process.cwd(), "../servers/sftp_host_key");
    const keyDir = path.dirname(keyPath);
    if (!fs.existsSync(keyDir)){
      fs.mkdirSync(keyDir, { recursive: true });
    }
    if (fs.existsSync(keyPath)) {
      const existingKey = fs.readFileSync(keyPath, "utf8").trim();
      if (existingKey) {
        return existingKey;
      }
    }
    const { privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
      },
    });
    fs.writeFileSync(keyPath, privateKey, "utf8");
    return privateKey;
  }

  public start() {
    const port = parseInt(process.env.SFTP_PORT || "2022", 10);

    this.server = new ssh2.Server(
      {
        hostKeys: [this.hostKey],
      },
      client => {
        let authenticatedUser: any = null;
        let targetServerId: string | null = null;
        console.log(authenticatedUser);
        client.on("authentication", ctx => {
          console.log(`SFTP authentication attempt: method=${ctx.method}, username=${ctx.username}`);
          if (ctx.method !== "password") {
            ctx.reject(["password"]);
            return;
          }

          this.handleAuth(ctx)
            .then(res => {
              if (res) {
                console.log(`SFTP Authentication successful for user: ${res.user.email}, serverId: ${res.serverId}`);
                authenticatedUser = res.user;
                targetServerId = res.serverId;
                ctx.accept();
              } else {
                console.warn(`SFTP Authentication failed for username: ${ctx.username}`);
                ctx.reject(["password"]);
              }
            })
            .catch(err => {
              console.error("SFTP Auth error:", err);
              ctx.reject(["password"]);
            });
        });

        client.on("ready", () => {
          client.on("session", (accept, _reject) => {
            const session = accept();
            session.on("sftp", (acceptSftp, _rejectSftp) => {
              const sftpStream = acceptSftp();
              if (targetServerId) {
                this.setupSftpHandlers(sftpStream, targetServerId);
              }
            });
          });
        });

        client.on("error", err => {
          // Suppress connection-level errors (client disconnects, resets)
          console.error(err);
        });
      }
    );

    this.server.listen(port, "0.0.0.0", () => {
      console.log(`SFTP Server listening on port ${port}`);
    });
  }

  private async handleAuth(ctx: AuthContext): Promise<{ user: any; serverId: string } | null> {
    if (ctx.method !== "password") {
      return null;
    }

    const username = ctx.username; // Format: admin.<serverId>
    const password = ctx.password;

    if (!username.startsWith("admin.")) {
      return null;
    }

    const serverId = username.substring(6);
    if (!serverId) {
      return null;
    }

    try {
      // Find server first
      const server = await this.serverRepository.findById(serverId);
      if (!server) {
        return null;
      }

      // Find user who owns the server
      const user = await this.userRepository.findByIdWithPassword(server.userId);
      if (!user || !user.password) {
        return null;
      }

      // Verify the password
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return { user, serverId };
    } catch (err) {
      console.error("SFTP Authenticator failed:", err);
      return null;
    }
  }

  private setupSftpHandlers(sftp: SFTPWrapper, serverId: string) {
    const serverDir = getServerDirectory(serverId);

    const resolvePath = (sftpPath: string): string => {
      const normalized = path.normalize(sftpPath).replace(/^(\.\.(\/|\\|$))+/, "");
      return path.join(serverDir, normalized);
    };

    const STATUS_CODE = {
      OK: 0,
      EOF: 1,
      NO_SUCH_FILE: 2,
      PERMISSION_DENIED: 3,
      FAILURE: 4,
      BAD_MESSAGE: 5,
      NO_CONNECTION: 6,
      CONNECTION_LOST: 7,
      OP_UNSUPPORTED: 8,
    };

    const formatAttrs = (stats: fs.Stats): Attributes => ({
      mode: stats.mode,
      uid: stats.uid ?? 0,
      gid: stats.gid ?? 0,
      size: stats.size,
      atime: Math.floor(stats.atimeMs / 1000),
      mtime: Math.floor(stats.mtimeMs / 1000),
    });

    const formatLongname = (name: string, stats: fs.Stats): string => {
      const modeStr = stats.isDirectory() ? "d" : "-";
      const permissions = (stats.mode & 0o777)
        .toString(8)
        .split("")
        .map(p => {
          const val = parseInt(p, 10);
          return [val & 4 ? "r" : "-", val & 2 ? "w" : "-", val & 1 ? "x" : "-"].join("");
        })
        .join("");

      const size = stats.size.toString().padStart(8);
      const mtime = stats.mtime.toDateString();
      return `${modeStr}${permissions} 1 admin admin ${size} ${mtime} ${name}`;
    };

    // REALPATH
    sftp.on("REALPATH", (id: number, pathName: string) => {
      let resolved = "/";
      if (pathName !== "." && pathName !== "./" && pathName !== "/") {
        resolved = path.normalize(pathName).replace(/\\/g, "/");
      }
      sftp.name(id, [
        {
          filename: resolved,
          longname: resolved,
          attrs: {
            mode: 0o40755,
            uid: 0,
            gid: 0,
            size: 0,
            atime: Math.floor(Date.now() / 1000),
            mtime: Math.floor(Date.now() / 1000),
          },
        },
      ]);
    });

    // STAT and LSTAT
    const handleStat = (id: any, pathName: string, _callback: any) => {
      const fullPath = resolvePath(pathName);
      fs.stat(fullPath, (err, stats) => {
        if (err) {
          sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
        } else {
          sftp.attrs(id, formatAttrs(stats));
        }
      });
    };
    sftp.on("STAT", handleStat);
    sftp.on("LSTAT", handleStat);

    // FSTAT
    sftp.on("FSTAT", (id: number, handle: Buffer) => {
      const info = this.handles.get(handle.toString("hex"));
      if (!info || info.fd === undefined) {
        return sftp.status(id, STATUS_CODE.FAILURE);
      }
      fs.fstat(info.fd, (err, stats) => {
        if (err) {
          sftp.status(id, STATUS_CODE.FAILURE);
        } else {
          sftp.attrs(id, formatAttrs(stats));
        }
      });
    });

    // OPENDIR
    sftp.on("OPENDIR", (id: number, pathName: string) => {
      const fullPath = resolvePath(pathName);
      fs.readdir(fullPath, { withFileTypes: true }, (err, entries) => {
        if (err) {
          sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
        } else {
          const files = entries.map(entry => {
            const entryFullPath = path.join(fullPath, entry.name);
            let stats: fs.Stats;
            try {
              stats = fs.statSync(entryFullPath);
            } catch {
              stats = {
                mode: 0o100644,
                uid: 0,
                gid: 0,
                size: 0,
                atimeMs: Date.now(),
                mtimeMs: Date.now(),
                mtime: new Date(),
                isDirectory: () => false,
                isFile: () => true,
              } as unknown as fs.Stats;
            }
            return {
              filename: entry.name,
              longname: formatLongname(entry.name, stats),
              attrs: formatAttrs(stats),
            };
          });

          const handle = crypto.randomBytes(4);
          this.handles.set(handle.toString("hex"), {
            dirContext: { files, index: 0 },
          });
          sftp.handle(id, handle);
        }
      });
    });

    // READDIR
    sftp.on("READDIR", (id: number, handle: Buffer) => {
      const hexHandle = handle.toString("hex");
      const info = this.handles.get(hexHandle);
      if (!info || !info.dirContext) {
        return sftp.status(id, STATUS_CODE.FAILURE);
      }

      const { files, index } = info.dirContext;
      if (index >= files.length) {
        sftp.status(id, STATUS_CODE.EOF);
      } else {
        const chunk = files.slice(index, index + 50);
        info.dirContext.index += chunk.length;
        sftp.name(id, chunk);
      }
    });

    // OPEN
    sftp.on("OPEN", (id: number, pathName: string, flagsMask: number, _attrs: Attributes) => {
      const fullPath = resolvePath(pathName);

      // Determine flags
      let flags = "r";
      const write = flagsMask & 0x02;
      const creat = flagsMask & 0x08;
      const trunc = flagsMask & 0x10;
      const append = flagsMask & 0x04;
      const excl = flagsMask & 0x20;

      if (write) {
        if (creat) {
          if (excl) flags = "wx";
          else if (trunc) flags = "w";
          else if (append) flags = "a";
          else flags = "r+";
        } else {
          if (append) flags = "a";
          else flags = "r+";
        }
      }

      fs.open(fullPath, flags, (err, fd) => {
        if (err) {
          if (err.code === "ENOENT") {
            sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
          } else {
            sftp.status(id, STATUS_CODE.PERMISSION_DENIED);
          }
        } else {
          const handle = crypto.randomBytes(4);
          this.handles.set(handle.toString("hex"), { fd });
          sftp.handle(id, handle);
        }
      });
    });

    // READ
    sftp.on("READ", (id: number, handle: Buffer, offset: number, length: number) => {
      const info = this.handles.get(handle.toString("hex"));
      if (!info || info.fd === undefined) {
        return sftp.status(id, STATUS_CODE.FAILURE);
      }

      const buffer = Buffer.alloc(length);
      fs.read(info.fd, buffer, 0, length, offset, (err, bytesRead) => {
        if (err) {
          sftp.status(id, STATUS_CODE.FAILURE);
        } else if (bytesRead === 0) {
          sftp.status(id, STATUS_CODE.EOF);
        } else {
          sftp.data(id, buffer.slice(0, bytesRead));
        }
      });
    });

    // WRITE
    sftp.on("WRITE", (id: number, handle: Buffer, offset: number, data: Buffer) => {
      const info = this.handles.get(handle.toString("hex"));
      if (!info || info.fd === undefined) {
        return sftp.status(id, STATUS_CODE.FAILURE);
      }

      fs.write(info.fd, data, 0, data.length, offset, err => {
        if (err) {
          sftp.status(id, STATUS_CODE.FAILURE);
        } else {
          sftp.status(id, STATUS_CODE.OK);
        }
      });
    });

    // CLOSE
    sftp.on("CLOSE", (id: number, handle: Buffer) => {
      const hexHandle = handle.toString("hex");
      const info = this.handles.get(hexHandle);
      if (info) {
        this.handles.delete(hexHandle);
        if (info.fd !== undefined) {
          fs.close(info.fd, () => {
            sftp.status(id, STATUS_CODE.OK);
          });
          return;
        }
      }
      sftp.status(id, STATUS_CODE.OK);
    });

    // REMOVE
    sftp.on("REMOVE", (id: number, pathName: string) => {
      const fullPath = resolvePath(pathName);
      fs.unlink(fullPath, err => {
        if (err) {
          sftp.status(id, STATUS_CODE.FAILURE);
        } else {
          sftp.status(id, STATUS_CODE.OK);
        }
      });
    });

    // RMDIR
    sftp.on("RMDIR", (id: number, pathName: string) => {
      const fullPath = resolvePath(pathName);
      fs.rmdir(fullPath, err => {
        if (err) {
          sftp.status(id, STATUS_CODE.FAILURE);
        } else {
          sftp.status(id, STATUS_CODE.OK);
        }
      });
    });

    // MKDIR
    sftp.on("MKDIR", (id: number, pathName: string, _attrs: Attributes) => {
      const fullPath = resolvePath(pathName);
      fs.mkdir(fullPath, err => {
        if (err) {
          sftp.status(id, STATUS_CODE.FAILURE);
        } else {
          sftp.status(id, STATUS_CODE.OK);
        }
      });
    });

    // RENAME
    sftp.on("RENAME", (id: number, oldPath: string, newPath: string) => {
      const fullOldPath = resolvePath(oldPath);
      const fullNewPath = resolvePath(newPath);
      fs.rename(fullOldPath, fullNewPath, err => {
        if (err) {
          sftp.status(id, STATUS_CODE.FAILURE);
        } else {
          sftp.status(id, STATUS_CODE.OK);
        }
      });
    });
  }
}
