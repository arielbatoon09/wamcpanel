import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException, BadRequestException, HttpException } from "@/exceptions";
import { getServerDirectory } from "@/utils/server-path";
import { docker } from "@/lib/docker";
import { ToggleServerPowerService } from "@/services/servers/toggle-server-power-service";
import { ActivityLogService } from "@/services/servers/activity-log-service";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { Readable } from "stream";

const BACKUPS_ROOT = path.resolve(process.cwd(), "../backups");

export interface BackupInfo {
  id: string;
  name: string;
  size: string;
  date: string;
}

@injectable()
export class BackupService {
  constructor(
    @inject(ServerRepository) private readonly serverRepository: ServerRepository,
    @inject(ToggleServerPowerService) private readonly togglePowerService: ToggleServerPowerService,
    @inject(ActivityLogService) private readonly activityLogService: ActivityLogService
  ) { }

  private async verifyServerAccess(serverId: string, userId: string) {
    const existing = await this.serverRepository.findByIdAndUserId(serverId, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }
    return existing;
  }

  private getBackupDirectory(serverId: string): string {
    const dir = path.join(BACKUPS_ROOT, serverId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
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
          if (
            chunk.length >= 8 &&
            (chunk[0] === 1 || chunk[0] === 2) &&
            chunk[1] === 0 &&
            chunk[2] === 0 &&
            chunk[3] === 0
          ) {
            text = chunk.subarray(8).toString("utf8");
          }
          output += text;
        });

        execStream.on("end", () => {
          resolve(output.trim());
        });

        execStream.on("error", (err) => {
          reject(err);
        });
      });
    } catch (err: any) {
      throw new BadRequestException(`RCON command failed: ${err.message}`);
    }
  }

  public async list(serverId: string, userId: string): Promise<BackupInfo[]> {
    await this.verifyServerAccess(serverId, userId);
    const backupDir = this.getBackupDirectory(serverId);

    try {
      const files = await fs.promises.readdir(backupDir);
      const backupList: BackupInfo[] = [];

      for (const filename of files) {
        if (!filename.toLowerCase().endsWith(".zip")) continue;

        const filepath = path.join(backupDir, filename);
        const stats = await fs.promises.stat(filepath);

        // Format size
        const bytes = stats.size;
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(k));
        const sizeStr = bytes === 0 ? "0 B" : parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];

        // Format date: YYYY-MM-DD HH:MM
        const dateStr = stats.mtime.toISOString().replace(/T/, " ").replace(/\..+/, "").substring(0, 16);

        backupList.push({
          id: filename,
          name: filename,
          size: sizeStr,
          date: dateStr,
        });
      }

      // Sort by newest first
      return backupList.sort((a, b) => b.id.localeCompare(a.id));
    } catch (err: any) {
      throw new BadRequestException(`Failed to list backups: ${err.message}`);
    }
  }

  public async create(serverId: string, userId: string, backupName: string): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const serverDir = getServerDirectory(serverId);
    const backupDir = this.getBackupDirectory(serverId);

    // Normalize backup name
    let cleanName = backupName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, "");
    if (!cleanName) {
      cleanName = `Backup-${new Date().toISOString().slice(0, 10)}`;
    }
    const filename = `${cleanName.replace(/\s+/g, "_")}_${Date.now()}.zip`;
    const targetZipPath = path.join(backupDir, filename);

    // Check if container is running
    const containerName = `wamc-server-${serverId}`;
    const container = docker.getContainer(containerName);
    let isRunning = false;
    try {
      const inspectData = await container.inspect();
      isRunning = inspectData.State.Running;
    } catch { }

    try {
      if (isRunning) {
        // Disable save, flush to disk
        await this.runRconCommand(serverId, "save-off");
        await this.runRconCommand(serverId, "save-all flush");
      }

      // Create zip archive
      const zip = new AdmZip();
      zip.addLocalFolder(serverDir);
      zip.writeZip(targetZipPath);

      await this.activityLogService.log(serverId, userId, "success", "backup", `Backup created: ${filename}`);
    } catch (err: any) {
      throw new BadRequestException(`Failed to create backup: ${err.message}`);
    } finally {
      if (isRunning) {
        // Re-enable save
        await this.runRconCommand(serverId, "save-on").catch(() => { });
      }
    }
  }

  public async delete(serverId: string, userId: string, filename: string): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const backupDir = this.getBackupDirectory(serverId);
    const filepath = path.join(backupDir, filename);

    // Safety check path traversal
    if (!filepath.startsWith(backupDir)) {
      throw new BadRequestException("Invalid filename");
    }

    try {
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
        await this.activityLogService.log(serverId, userId, "warning", "backup", `Backup deleted: ${filename}`);
      } else {
        throw new NotFoundException("Backup file not found");
      }
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new BadRequestException(`Failed to delete backup: ${err.message}`);
    }
  }

  public async getDownloadPath(serverId: string, userId: string, filename: string): Promise<string> {
    await this.verifyServerAccess(serverId, userId);
    const backupDir = this.getBackupDirectory(serverId);
    const filepath = path.join(backupDir, filename);

    // Safety check path traversal
    if (!filepath.startsWith(backupDir)) {
      throw new BadRequestException("Invalid filename");
    }

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException("Backup file not found");
    }

    return filepath;
  }

  public async upload(serverId: string, userId: string, filename: string, stream: Readable): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const backupDir = this.getBackupDirectory(serverId);

    // Ensure filename ends with .zip
    const cleanName = filename.toLowerCase().endsWith(".zip") ? filename : `${filename}.zip`;
    const targetPath = path.join(backupDir, cleanName);

    if (!targetPath.startsWith(backupDir)) {
      throw new BadRequestException("Invalid filename");
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(targetPath);
        stream.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", (err) => {
          writeStream.destroy();
          reject(err);
        });
      });
      await this.activityLogService.log(serverId, userId, "success", "backup", `Backup archive uploaded: ${cleanName}`);
    } catch (err: any) {
      throw new BadRequestException(`Upload failed: ${err.message}`);
    }
  }

  public async restore(serverId: string, userId: string, filename: string): Promise<void> {
    const server = await this.verifyServerAccess(serverId, userId);
    const serverDir = getServerDirectory(serverId);
    const backupDir = this.getBackupDirectory(serverId);
    const zipPath = path.join(backupDir, filename);

    if (!zipPath.startsWith(backupDir) || !fs.existsSync(zipPath)) {
      throw new NotFoundException("Backup file not found");
    }

    const containerName = `wamc-server-${serverId}`;
    const container = docker.getContainer(containerName);

    let wasRunning = false;
    try {
      const inspectData = await container.inspect();
      wasRunning = inspectData.State.Running;
      if (wasRunning) {
        // Stop server synchronously to prevent file lock issues
        await container.stop({ t: 15 });
        // Set offline status in DB
        await this.serverRepository.update(serverId, userId, {
          status: "OFFLINE",
          cpuUsage: 0,
          ramUsage: 0,
          uptime: 0,
        });
      }
    } catch { }

    try {
      // Clear server directory
      const files = await fs.promises.readdir(serverDir);
      for (const file of files) {
        const itemPath = path.join(serverDir, file);
        await fs.promises.rm(itemPath, { recursive: true, force: true });
      }

      // Extract backup
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(serverDir, true);

      await this.activityLogService.log(serverId, userId, "success", "backup", `Backup restored: ${filename}`);

      // Start server again if it was running
      if (wasRunning) {
        await this.togglePowerService.execute(serverId, userId, "start");
      }
    } catch (err: any) {
      throw new BadRequestException(`Failed to restore backup: ${err.message}`);
    }
  }
}
