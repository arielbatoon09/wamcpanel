import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException, BadRequestException } from "@/exceptions";
import { getServerDirectory } from "@/utils/server-path";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { Readable } from "stream";
import { ActivityLogService } from "@/services/servers/activity-log-service";

export interface PluginInfo {
  name: string;
  version: string;
  desc: string;
  enabled: boolean;
  pluginPath: string;
}

@injectable()
export class PluginService {
  constructor(
    @inject(ServerRepository) private readonly serverRepository: ServerRepository,
    @inject(ActivityLogService) private readonly activityLogService: ActivityLogService
  ) { }

  private async verifyServerAccess(serverId: string, userId: string) {
    const existing = await this.serverRepository.findByIdAndUserId(serverId, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }
    return existing;
  }

  private resolveSafePluginPath(serverId: string, relativePath: string): string {
    const root = getServerDirectory(serverId);
    const safePath = path.normalize(path.join(root, relativePath));

    if (!safePath.startsWith(root)) {
      throw new BadRequestException("Invalid path: directory traversal detected");
    }

    // Must be inside plugins folder
    const pluginsRoot = path.join(root, "plugins");
    if (!safePath.startsWith(pluginsRoot)) {
      throw new BadRequestException("Access denied: path must be inside plugins directory");
    }

    return safePath;
  }

  private parsePluginYml(content: string) {
    const result: { name?: string; version?: string; description?: string } = {};
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex !== -1) {
        const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
        let val = trimmed.substring(colonIndex + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (key === "name") result.name = val;
        if (key === "version") result.version = val;
        if (key === "description") result.description = val;
      }
    }
    return result;
  }

  private async getPluginDetails(jarPath: string, defaultName: string): Promise<{ name: string; version: string; desc: string }> {
    try {
      const zip = new AdmZip(jarPath);
      const entry = zip.getEntry("plugin.yml");
      if (entry) {
        const content = entry.getData().toString("utf8");
        const parsed = this.parsePluginYml(content);
        return {
          name: parsed.name || defaultName,
          version: parsed.version || "1.0.0",
          desc: parsed.description || "No description provided.",
        };
      }
    } catch {
      // Fall through to default
    }

    return {
      name: defaultName,
      version: "N/A",
      desc: "No description provided.",
    };
  }

  public async listPlugins(serverId: string, userId: string): Promise<PluginInfo[]> {
    await this.verifyServerAccess(serverId, userId);
    const serverDir = getServerDirectory(serverId);
    const pluginsDir = path.join(serverDir, "plugins");
    const archivedDir = path.join(pluginsDir, "archived");

    const pluginsList: PluginInfo[] = [];

    // Ensure plugins folder exists
    try {
      await fs.promises.mkdir(pluginsDir, { recursive: true });
    } catch {
      return [];
    }

    // 1. Scan active plugins
    try {
      const activeEntries = await fs.promises.readdir(pluginsDir, { withFileTypes: true });
      for (const entry of activeEntries) {
        if (entry.isFile() && entry.name.toLowerCase().endsWith(".jar")) {
          const jarPath = path.join(pluginsDir, entry.name);
          const defaultName = path.basename(entry.name, ".jar");
          const details = await this.getPluginDetails(jarPath, defaultName);
          pluginsList.push({
            ...details,
            enabled: true,
            pluginPath: `plugins/${entry.name}`,
          });
        }
      }
    } catch {
      // Ignored
    }

    // 2. Scan archived (disabled) plugins
    try {
      const archivedEntries = await fs.promises.readdir(archivedDir, { withFileTypes: true });
      for (const entry of archivedEntries) {
        if (entry.isFile() && entry.name.toLowerCase().endsWith(".jar")) {
          const jarPath = path.join(archivedDir, entry.name);
          const defaultName = path.basename(entry.name, ".jar");
          const details = await this.getPluginDetails(jarPath, defaultName);
          pluginsList.push({
            ...details,
            enabled: false,
            pluginPath: `plugins/archived/${entry.name}`,
          });
        }
      }
    } catch {
      // Ignored
    }

    return pluginsList.sort((a, b) => a.name.localeCompare(b.name));
  }

  public async togglePlugin(serverId: string, userId: string, relativePluginPath: string, enable: boolean): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const currentPath = this.resolveSafePluginPath(serverId, relativePluginPath);
    const fileName = path.basename(currentPath);

    const serverDir = getServerDirectory(serverId);
    const pluginsDir = path.join(serverDir, "plugins");
    const archivedDir = path.join(pluginsDir, "archived");

    let targetPath = "";
    if (enable) {
      targetPath = path.join(pluginsDir, fileName);
    } else {
      await fs.promises.mkdir(archivedDir, { recursive: true });
      targetPath = path.join(archivedDir, fileName);
    }

    if (currentPath === targetPath) {
      return; // Already in target location
    }

    try {
      await fs.promises.rename(currentPath, targetPath);
      const actionStr = enable ? "enabled" : "disabled";
      await this.activityLogService.log(serverId, userId, "info", "player", `Plugin "${fileName}" was ${actionStr}.`);
    } catch (err: any) {
      throw new BadRequestException(`Failed to toggle plugin: ${err.message}`);
    }
  }

  public async deletePlugin(serverId: string, userId: string, relativePluginPath: string): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const targetPath = this.resolveSafePluginPath(serverId, relativePluginPath);

    try {
      await fs.promises.unlink(targetPath);
      const fileName = path.basename(targetPath);
      await this.activityLogService.log(serverId, userId, "warning", "player", `Plugin "${fileName}" has been deleted/uninstalled.`);
    } catch (err: any) {
      throw new BadRequestException(`Failed to delete plugin: ${err.message}`);
    }
  }

  public async uploadPlugin(serverId: string, userId: string, fileName: string, stream: Readable): Promise<void> {
    await this.verifyServerAccess(serverId, userId);

    if (!fileName.toLowerCase().endsWith(".jar")) {
      throw new BadRequestException("Only plugin .jar files are allowed");
    }

    const serverDir = getServerDirectory(serverId);
    const pluginsDir = path.join(serverDir, "plugins");
    const targetPath = path.join(pluginsDir, fileName);

    // Ensure plugins folder exists
    await fs.promises.mkdir(pluginsDir, { recursive: true });

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
      await this.activityLogService.log(serverId, userId, "success", "player", `Plugin file "${fileName}" was uploaded.`);
    } catch (err: any) {
      throw new BadRequestException(`Upload failed: ${err.message}`);
    }
  }
}
