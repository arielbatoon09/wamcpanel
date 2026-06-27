import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException } from "@/exceptions";
import { toServerResponse } from "@/utils/server-mapper";
import * as path from "path";
import { docker } from "@/lib/docker";
import { getServerDirectory } from "@/utils/server-path";
import { readServerProperties } from "@/utils/server-properties";
import { ActivityLogService } from "./activity-log-service";

@injectable()
export class ToggleServerPowerService {
  constructor(
    @inject(ServerRepository) private readonly serverRepository: ServerRepository,
    @inject(ActivityLogService) private readonly activityLogService: ActivityLogService
  ) { }

  public async execute(id: string, userId: string, action: "start" | "stop" | "restart" | "kill") {
    const existing = await this.serverRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }

    const containerName = `wamc-server-${id}`;
    const container = docker.getContainer(containerName);

    if (action === "start") {
      if (existing.status !== "OFFLINE") {
        return { message: "Server is not offline", data: { server: toServerResponse(existing) } };
      }

      const server = await this.serverRepository.update(id, userId, {
        status: "STARTING",
        cpuUsage: 85,
        ramUsage: Math.floor(existing.ramLimit * 0.2),
      });

      await this.activityLogService.log(id, userId, "success", "power", "Server start sequence initiated.");

      // Background setup and start process to avoid API timeout
      (async () => {
        try {
          let containerExists = false;
          try {
            const inspectData = await container.inspect();
            containerExists = true;

            // Recreate container if it exists but is offline to apply database configuration changes (like version, RAM/CPU limits, Java runtime)
            if (!inspectData.State.Running) {
              await container.remove({ force: true }).catch(() => { });
              containerExists = false;
            }
          } catch (inspectError: any) {
            if (inspectError.statusCode !== 404) {
              throw inspectError;
            }
          }

          if (!containerExists) {
            const isVelocity = existing.software === "Velocity";
            const image = isVelocity ? "itzg/mc-proxy" : `itzg/minecraft-server:java${existing.javaVersion}`;
            const containerPort = isVelocity ? "25577/tcp" : "25565/tcp";

            // Pull image
            await new Promise<void>((resolve, reject) => {
              docker.pull(image, {}, (err, stream) => {
                if (err) return reject(err);
                if (!stream) return reject(new Error("No stream returned from docker pull"));
                docker.modem.followProgress(stream, followErr => {
                  if (followErr) reject(followErr);
                  else resolve();
                });
              });
            });

            const properties = await readServerProperties(id);
            const onlineMode = properties["online-mode"] !== "false";

            // Create container
            const hostDir = getServerDirectory(id);
            let dockerBindDir = hostDir;

            if (process.platform === "win32") {
              dockerBindDir = `/mnt/${hostDir.charAt(0).toLowerCase()}${hostDir.slice(2).replace(/\\/g, "/")}`;
            } else if (process.env.HOST_SERVERS_DIR) {
              // Ensure forward slashes for docker bind paths
              dockerBindDir = path.posix.join(process.env.HOST_SERVERS_DIR.replace(/\\/g, "/"), id);
            }

            const Env = ["EULA=TRUE", `TYPE=${existing.software.toUpperCase()}`, `ONLINE_MODE=${onlineMode ? "TRUE" : "FALSE"}`, "CREATE_CONSOLE_IN_PIPE=true"];

            if (isVelocity) {
              Env.push("VELOCITY_VERSION=latest");
            } else {
              Env.push(`VERSION=${existing.version}`);
            }

            if (existing.worldSeed) {
              Env.push(`SEED=${existing.worldSeed}`);
            }
            if (existing.worldType) {
              Env.push(`LEVEL_TYPE=${existing.worldType}`);
            }
            if (existing.generateStructures !== undefined) {
              Env.push(`GENERATE_STRUCTURES=${existing.generateStructures ? "TRUE" : "FALSE"}`);
            }

            const ramGb = Math.floor(existing.ramLimit / 1024);
            Env.push(`MEMORY=${ramGb > 0 ? `${ramGb}G` : `${existing.ramLimit}M`}`);

            await docker.createContainer({
              Image: image,
              name: containerName,
              Env,
              ExposedPorts: {
                [containerPort]: {},
              },
              HostConfig: {
                PortBindings: {
                  [containerPort]: [
                    {
                      HostPort: existing.port.toString(),
                    },
                  ],
                },
                Binds: [`${dockerBindDir}:${isVelocity ? "/server" : "/data"}`],
                Memory: existing.ramLimit * 1024 * 1024,
                NanoCpus: existing.cpuLimit * 10000000,
              },
            });
          }

          // Start the container
          await container.start();

          // Wait 5 seconds and update status to ONLINE
          setTimeout(async () => {
            try {
              const inspectData = await container.inspect();
              if (inspectData.State.Running) {
                await this.serverRepository.update(id, userId, {
                  status: "ONLINE",
                  cpuUsage: 12.4,
                  ramUsage: Math.floor(existing.ramLimit * 0.5),
                  uptime: 1,
                });
              } else {
                await this.serverRepository.update(id, userId, {
                  status: "OFFLINE",
                  cpuUsage: 0,
                  ramUsage: 0,
                  uptime: 0,
                });
              }
            } catch (inspectErr) {
              console.error("Failed to inspect container post-start:", inspectErr);
              await this.serverRepository
                .update(id, userId, {
                  status: "OFFLINE",
                  cpuUsage: 0,
                  ramUsage: 0,
                  uptime: 0,
                })
                .catch(() => { });
            }
          }, 5000);
        } catch (backgroundError) {
          console.error("Background server startup failed:", backgroundError);
          await this.serverRepository
            .update(id, userId, {
              status: "OFFLINE",
              cpuUsage: 0,
              ramUsage: 0,
              uptime: 0,
            })
            .catch(() => { });
        }
      })();

      return {
        message: "Server start sequence initiated",
        data: { server: toServerResponse(server) },
      };
    }

    if (action === "stop") {
      if (existing.status !== "ONLINE" && existing.status !== "STARTING") {
        return { message: "Server is not running", data: { server: toServerResponse(existing) } };
      }

      const server = await this.serverRepository.update(id, userId, {
        status: "STOPPING",
        cpuUsage: 35,
        ramUsage: Math.floor(existing.ramLimit * 0.4),
      });

      await this.activityLogService.log(id, userId, "info", "power", "Server stop sequence initiated.");

      // Trigger docker stop
      container
        .stop()
        .then(async () => {
          try {
            await this.serverRepository.update(id, userId, {
              status: "OFFLINE",
              cpuUsage: 0,
              ramUsage: 0,
              uptime: 0,
            });
          } catch {
            // ignore database update failure
          }
        })
        .catch(async () => {
          // If container stop fails (e.g. already stopped), set to offline
          try {
            await this.serverRepository.update(id, userId, {
              status: "OFFLINE",
              cpuUsage: 0,
              ramUsage: 0,
              uptime: 0,
            });
          } catch {
            // ignore database update failure
          }
        });

      return {
        message: "Server stop sequence initiated",
        data: { server: toServerResponse(server) },
      };
    }

    if (action === "restart") {
      const server = await this.serverRepository.update(id, userId, {
        status: "STOPPING",
        cpuUsage: 35,
        ramUsage: Math.floor(existing.ramLimit * 0.4),
      });

      await this.activityLogService.log(id, userId, "warning", "power", "Server restart triggered manually.");

      (async () => {
        try {
          try {
            await container.stop({ t: 10 }).catch(() => { });
          } catch {
            // ignore stop failure
          }

          try {
            await container.remove({ force: true }).catch(() => { });
          } catch {
            // ignore remove failure
          }

          await this.serverRepository.update(id, userId, { status: "OFFLINE" });
          await this.execute(id, userId, "start");
        } catch (err) {
          console.error("Failed to restart container:", err);
          await this.serverRepository
            .update(id, userId, {
              status: "OFFLINE",
              cpuUsage: 0,
              ramUsage: 0,
              uptime: 0,
            })
            .catch(() => { });
        }
      })();

      return {
        message: "Server restart sequence initiated",
        data: { server: toServerResponse(server) },
      };
    }

    if (action === "kill") {
      await container.kill().catch(() => { });

      const server = await this.serverRepository.update(id, userId, {
        status: "OFFLINE",
        cpuUsage: 0,
        ramUsage: 0,
        uptime: 0,
      });

      await this.activityLogService.log(id, userId, "error", "power", "Kill signal sent — server terminated.");

      return {
        message: "Server killed successfully",
        data: { server: toServerResponse(server) },
      };
    }

    return {
      message: "Invalid action",
      data: { server: toServerResponse(existing) },
    };
  }
}
