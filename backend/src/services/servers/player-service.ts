import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException, BadRequestException } from "@/exceptions";
import { getServerDirectory } from "@/utils/server-path";
import { docker } from "@/lib/docker";
import fs from "fs";
import path from "path";
import { ActivityLogService } from "@/services/servers/activity-log-service";

export interface PlayerInfo {
  name: string;
  uuid: string;
  op: boolean;
  ping: string;
  ip: string;
}

const stripAnsi = (text: string): string => {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
};

@injectable()
export class PlayerService {
  constructor(
    @inject(ServerRepository) private readonly serverRepository: ServerRepository,
    @inject(ActivityLogService) private readonly activityLogService: ActivityLogService
  ) {}

  private async verifyServerAccess(serverId: string, userId: string) {
    const existing = await this.serverRepository.findByIdAndUserId(serverId, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }
    return existing;
  }

  private async runRconCommand(serverId: string, command: string): Promise<string> {
    const containerName = `wamc-server-${serverId}`;
    const container = docker.getContainer(containerName);

    try {
      const inspect = await container.inspect();
      if (!inspect.State.Running) {
        throw new BadRequestException("Server is offline");
      }

      const exec = await container.exec({
        Cmd: ["rcon-cli", command],
        User: "1000",
        AttachStdout: true,
        AttachStderr: true,
      });

      const execStream = await exec.start({});

      return new Promise<string>((resolve, reject) => {
        let output = "";
        execStream.on("data", (chunk: Buffer) => {
          let text = chunk.toString("utf8");
          if (chunk.length >= 8 && (chunk[0] === 1 || chunk[0] === 2) && chunk[1] === 0 && chunk[2] === 0 && chunk[3] === 0) {
            text = chunk.subarray(8).toString("utf8");
          }
          output += text;
        });

        execStream.on("end", () => {
          resolve(output.trim());
        });

        execStream.on("error", err => {
          reject(err);
        });
      });
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`RCON command failed: ${err.message}`);
    }
  }

  public async listOnlinePlayers(serverId: string, userId: string): Promise<PlayerInfo[]> {
    await this.verifyServerAccess(serverId, userId);
    const containerName = `wamc-server-${serverId}`;
    const container = docker.getContainer(containerName);

    try {
      const inspect = await container.inspect();
      if (!inspect.State.Running) {
        return []; // offline
      }
    } catch {
      return []; // not running/created
    }

    // Run 'list' command
    const rawListResult = await this.runRconCommand(serverId, "list");
    const listResult = stripAnsi(rawListResult);
    // e.g. "There are 1 of a max of 20 players online: Maezt" or "There are 0 of a max of 20 players online:"
    const colonIndex = listResult.indexOf(":");
    if (colonIndex === -1) {
      return [];
    }

    const playersPart = listResult.substring(colonIndex + 1).trim();
    if (!playersPart) {
      return [];
    }

    const onlineNames = playersPart
      .split(",")
      .map(name => name.trim())
      .filter(Boolean);
    if (onlineNames.length === 0) {
      return [];
    }

    // Load usercache.json and ops.json
    const serverDir = getServerDirectory(serverId);
    const usercachePath = path.join(serverDir, "usercache.json");
    const opsPath = path.join(serverDir, "ops.json");

    let usercache: any[] = [];
    try {
      const content = await fs.promises.readFile(usercachePath, "utf8");
      usercache = JSON.parse(content);
    } catch {
      // Ignored
    }

    let ops: any[] = [];
    try {
      const content = await fs.promises.readFile(opsPath, "utf8");
      ops = JSON.parse(content);
    } catch {
      // Ignored
    }

    return onlineNames.map(name => {
      // Find UUID
      const cacheEntry = usercache.find((entry: any) => entry.name.toLowerCase() === name.toLowerCase());
      const uuid = cacheEntry ? cacheEntry.uuid : "N/A";

      // Find OP status
      const isOp = ops.some((entry: any) => entry.name.toLowerCase() === name.toLowerCase() || entry.uuid === uuid);

      return {
        name,
        uuid,
        op: isOp,
        ping: "20ms", // Static display ping
        ip: "127.0.0.1", // Static/masked display IP
      };
    });
  }

  public async kickPlayer(serverId: string, userId: string, player: string): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    await this.runRconCommand(serverId, `kick ${player}`);
    await this.activityLogService.log(serverId, userId, "warning", "player", `Player "${player}" has been kicked from the server.`);
  }

  public async toggleOp(serverId: string, userId: string, player: string, op: boolean): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const cmd = op ? `op ${player}` : `deop ${player}`;
    await this.runRconCommand(serverId, cmd);
    await this.activityLogService.log(serverId, userId, "info", "player", `Operator status for "${player}" set to: ${op}`);
  }
}
