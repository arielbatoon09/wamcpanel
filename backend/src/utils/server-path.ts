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
