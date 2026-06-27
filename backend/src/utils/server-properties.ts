import * as fs from "fs/promises";
import * as path from "path";
import { getServerDirectory } from "./server-path";

export async function readServerProperties(serverId: string): Promise<Record<string, string>> {
  const hostDir = getServerDirectory(serverId);
  const propertiesPath = path.join(hostDir, "server.properties");

  const properties: Record<string, string> = {
    // Defaults as requested
    "online-mode": "true",
    pvp: "true",
    gamemode: "survival",
    difficulty: "easy",
    "allow-flight": "false",
    "enable-command-block": "false",
    hardcore: "false",
    "view-distance": "10",
    "simulation-distance": "8",
    "spawn-protection": "16",
    "white-list": "false",
    "enforce-whitelist": "false",
    motd: "A Minecraft Server",
  };

  try {
    const content = await fs.readFile(propertiesPath, "utf-8");
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
        continue;
      }

      const equalIndex = trimmed.indexOf("=");
      if (equalIndex !== -1) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        properties[key] = value;
      }
    }
  } catch (err: any) {
    // If file doesn't exist, we return the defaults
    if (err.code !== "ENOENT") {
      console.error("Error reading server.properties:", err);
    }
  }

  return properties;
}

export async function writeServerProperties(serverId: string, newProperties: Record<string, string>): Promise<void> {
  const hostDir = getServerDirectory(serverId);
  const propertiesPath = path.join(hostDir, "server.properties");

  // Read existing properties or defaults
  const properties = await readServerProperties(serverId);

  // Merge new properties
  for (const [key, value] of Object.entries(newProperties)) {
    if (value !== undefined && value !== null) {
      properties[key] = String(value);
    }
  }

  // Construct properties file content
  const outputLines = ["# Minecraft server properties", "# Managed by WAMCPanel"];

  for (const [key, value] of Object.entries(properties)) {
    outputLines.push(`${key}=${value}`);
  }

  // Ensure server directory exists
  await fs.mkdir(hostDir, { recursive: true });
  await fs.writeFile(propertiesPath, outputLines.join("\n"), "utf-8");
}
