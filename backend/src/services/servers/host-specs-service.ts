import { injectable } from "tsyringe";
import os from "os";
import fs from "fs";
import path from "path";

export interface HostSpecsResponse {
  cpuModel: string;
  cpuCores: number;
  totalRam: number; // in bytes
  freeRam: number; // in bytes
  platform: string;
  release: string;
  osType: string;
  uptime: number; // in seconds
  totalDisk: number; // in bytes
  freeDisk: number; // in bytes
}

@injectable()
export class HostSpecsService {
  public async getSpecs(): Promise<HostSpecsResponse> {
    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || "Unknown CPU";
    const cpuCores = cpus.length;
    const platform = os.platform();
    const release = os.release();
    const osType = os.type();
    const uptime = os.uptime();

    // Default mock disk sizes if we cannot read actual
    let totalDisk = 960 * 1024 * 1024 * 1024; // 960 GB
    let freeDisk = 576 * 1024 * 1024 * 1024; // 576 GB

    // Try to get actual disk stats using fs.statfs if available (Node 18.15.0+)
    if (typeof fs.statfsSync === "function") {
      try {
        const rootPath = platform === "win32" ? "C:\\" : "/";
        const stats = fs.statfsSync(rootPath);
        const blockSize = stats.bsize;
        totalDisk = stats.blocks * blockSize;
        freeDisk = stats.bfree * blockSize;
      } catch (err) {
        // Fallback to default mock disk
      }
    }

    return {
      cpuModel,
      cpuCores,
      totalRam,
      freeRam,
      platform,
      release,
      osType,
      uptime,
      totalDisk,
      freeDisk,
    };
  }
}
