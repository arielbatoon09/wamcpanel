import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { UserRepository } from "@/repositories/user-repository";
import { NotFoundException } from "@/exceptions";
import fs from "fs";
import path from "path";

const LOGS_ROOT = path.resolve(process.cwd(), "../logs");

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  category: "power" | "config" | "player" | "backup" | "system" | "file";
  actor: string;
  message: string;
}

@injectable()
export class ActivityLogService {
  constructor(
    @inject(ServerRepository) private readonly serverRepository: ServerRepository,
    @inject(UserRepository) private readonly userRepository: UserRepository
  ) {}

  private getLogFilePath(serverId: string): string {
    const dir = path.join(LOGS_ROOT, serverId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, "activity.json");
  }

  public async log(
    serverId: string,
    userId: string | "system",
    level: "info" | "success" | "warning" | "error",
    category: "power" | "config" | "player" | "backup" | "system" | "file",
    message: string
  ): Promise<void> {
    let actor = "System";

    if (userId !== "system") {
      try {
        const user = await this.userRepository.findById(userId);
        if (user) {
          actor = user.name || user.email;
        }
      } catch (err) {
        console.error("Failed to resolve user for activity logging:", err);
      }
    }

    const logEntry: ActivityLogEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      actor,
      message,
    };

    const filePath = this.getLogFilePath(serverId);

    try {
      let logs: ActivityLogEntry[] = [];
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath, "utf8");
        try {
          logs = JSON.parse(content);
        } catch {
          logs = [];
        }
      }
      logs.push(logEntry);
      
      // Limit to last 1000 entries to prevent files growing infinitely
      if (logs.length > 1000) {
        logs = logs.slice(logs.length - 1000);
      }

      await fs.promises.writeFile(filePath, JSON.stringify(logs, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to write activity log:", err);
    }
  }

  public async getLogs(serverId: string, userId: string): Promise<ActivityLogEntry[]> {
    const existing = await this.serverRepository.findByIdAndUserId(serverId, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }

    const filePath = this.getLogFilePath(serverId);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    try {
      const content = await fs.promises.readFile(filePath, "utf8");
      const logs: ActivityLogEntry[] = JSON.parse(content);
      // Sort newest first
      return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (err) {
      console.error("Failed to read activity logs:", err);
      return [];
    }
  }
}
