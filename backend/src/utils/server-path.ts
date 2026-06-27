import fs from "fs";
import path from "path";

const SERVERS_ROOT = path.resolve(process.cwd(), "../servers");

export function getServerDirectory(serverId: string): string {
  const dirPath = path.join(SERVERS_ROOT, serverId);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

export function deleteServerDirectory(serverId: string): void {
  const dirPath = path.join(SERVERS_ROOT, serverId);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

export function getServerDirectorySize(serverId: string): number {
  const dirPath = path.join(SERVERS_ROOT, serverId);
  if (!fs.existsSync(dirPath)) return 0;

  let totalSize = 0;

  function calculateSize(directory: string) {
    try {
      const files = fs.readdirSync(directory);
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          calculateSize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (err) {
      // Ignore directories or files we cannot access
      console.log(err);
    }
  }

  calculateSize(dirPath);
  return totalSize;
}
