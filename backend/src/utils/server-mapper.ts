import type { Server } from "@prisma/client";
import { getServerDirectorySize } from "./server-path";

/**
 * Maps a flat Prisma Server record to the API response shape
 * expected by the frontend:
 * - Nests cpuUsage/ramUsage/uptime under `metrics`
 * - Lowercases the ServerStatus enum ("ONLINE" → "online")
 * - Stringifies DateTime fields to ISO strings
 */
export function toServerResponse(server: Server) {
  const { cpuUsage, ramUsage, uptime, status, createdAt, updatedAt, ...rest } = server;

  const diskUsage = getServerDirectorySize(server.id);

  return {
    ...rest,
    status: status.toLowerCase() as "online" | "offline" | "starting" | "stopping",
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    metrics: {
      cpuUsage,
      ramUsage,
      uptime,
      diskUsage,
    },
  };
}

export type ServerResponse = ReturnType<typeof toServerResponse>;
