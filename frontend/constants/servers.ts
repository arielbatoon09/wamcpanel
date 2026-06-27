export interface ServerAPIResponse {
  id: string;
  name: string;
  description: string | null;
  status: "online" | "offline" | "starting" | "stopping";
  host: string;
  port: number;
  version: string;
  buildNumber?: string | null;
  software: "Vanilla" | "Paper" | "Forge" | "Velocity" | "Fabric" | "NeoForge" | "Quilt" | "Modpack" | "Bedrock";
  maxPlayers: number;
  currentPlayers: number;
  cpuLimit: number; // e.g. 200 for 200% (2 cores)
  ramLimit: number; // in MB, e.g. 4096 for 4GB
  javaVersion?: string | null;
  worldSeed?: string | null;
  worldType?: string | null;
  generateStructures?: boolean;
  metrics: {
    cpuUsage: number;
    ramUsage: number;
    uptime: number;
    diskUsage?: number;
  };
  createdAt: string;
  updatedAt: string;
  settings?: Record<string, string>;
}

export const INITIAL_SERVERS: ServerAPIResponse[] = [
  {
    id: "srv-01",
    name: "Survival Hub",
    description: "Main community survival server with custom claims and active economy.",
    status: "online",
    host: "survival.mcpanel.local",
    port: 25565,
    version: "1.20.4",
    software: "Paper",
    maxPlayers: 50,
    currentPlayers: 14,
    cpuLimit: 200,
    ramLimit: 6144,
    metrics: {
      cpuUsage: 24.5,
      ramUsage: 4120,
      uptime: 86400 * 3 + 12400, // 3 days +
    },
    createdAt: "2026-01-10T12:00:00Z",
    updatedAt: "2026-06-23T18:00:00Z",
  },
  {
    id: "srv-02",
    name: "SkyBlock Premium",
    description: "SkyBlock server with automated island generators and ranking systems.",
    status: "starting",
    host: "skyblock.mcpanel.local",
    port: 25566,
    version: "1.20.2",
    software: "Paper",
    maxPlayers: 80,
    currentPlayers: 0,
    cpuLimit: 100,
    ramLimit: 4096,
    metrics: {
      cpuUsage: 89.2,
      ramUsage: 1250,
      uptime: 0,
    },
    createdAt: "2026-02-15T09:30:00Z",
    updatedAt: "2026-06-24T00:20:00Z",
  },
  {
    id: "srv-03",
    name: "Global Network Proxy",
    description: "Velocity high-performance proxy routing traffic to child servers.",
    status: "online",
    host: "play.mcpanel.local",
    port: 25577,
    version: "3.3.0",
    software: "Velocity",
    maxPlayers: 500,
    currentPlayers: 14,
    cpuLimit: 100,
    ramLimit: 2048,
    metrics: {
      cpuUsage: 4.8,
      ramUsage: 820,
      uptime: 86400 * 14 + 43200, // 14 days +
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-06-23T23:55:00Z",
  },
  {
    id: "srv-04",
    name: "Pixelmon Forge Realm",
    description: "Pixelmon server requiring custom client modpack install.",
    status: "offline",
    host: "pixelmon.mcpanel.local",
    port: 25567,
    version: "1.20.1",
    software: "Forge",
    maxPlayers: 40,
    currentPlayers: 0,
    cpuLimit: 300,
    ramLimit: 8192,
    metrics: {
      cpuUsage: 0,
      ramUsage: 0,
      uptime: 0,
    },
    createdAt: "2026-03-20T16:45:00Z",
    updatedAt: "2026-06-23T12:00:00Z",
  },
];
