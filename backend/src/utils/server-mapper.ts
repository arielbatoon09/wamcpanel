import { Server } from "../../generated/prisma/client";

/**
 * Maps a flat Prisma Server record to the API response shape
 * expected by the frontend:
 * - Nests cpuUsage/ramUsage/uptime under `metrics`
 * - Lowercases the ServerStatus enum ("ONLINE" → "online")
 * - Stringifies DateTime fields to ISO strings
 */
export function toServerResponse(server: Server) {
  const { cpuUsage, ramUsage, uptime, status, createdAt, updatedAt, ...rest } = server;

  return {
    ...rest,
    status: status.toLowerCase() as "online" | "offline" | "starting" | "stopping",
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    metrics: {
      cpuUsage,
      ramUsage,
      uptime,
    },
  };
}

export type ServerResponse = ReturnType<typeof toServerResponse>;
