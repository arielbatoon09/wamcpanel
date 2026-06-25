import { z } from "zod";

export const createServerSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Server name must be at least 3 characters").max(30, "Server name must be under 30 characters"),
    description: z.string().max(150, "Description must be under 150 characters").optional().default(""),
    software: z.enum(["Vanilla", "Paper", "Modpack", "Fabric", "Bedrock", "Forge", "NeoForge", "Quilt", "Velocity"], {
      message: "Please select a valid server software",
    }),
    version: z.string().min(1, "Version is required"),
    buildNumber: z.string().optional().nullable(),
    port: z.coerce.number().int().min(1024, "Port must be >= 1024").max(65535, "Port must be <= 65535"),
    ramLimit: z.coerce.number().int().min(1024, "RAM limit must be at least 1024MB (1GB)").max(65536, "RAM limit must be <= 64GB (65536MB)"),
    cpuLimit: z.coerce.number().int().min(100, "CPU limit must be at least 100% (1 Core)").max(800, "CPU limit must be <= 800% (8 Cores)"),
    javaVersion: z.enum(["17", "21", "25"]).default("21"),
    worldSeed: z.string().optional().nullable(),
    worldType: z.enum(["DEFAULT", "FLAT", "LARGE_BIOMES", "AMPLIFIED"]).default("DEFAULT"),
    generateStructures: z.boolean().default(true),
  }),
});

export const updateServerSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(30).optional(),
    description: z.string().max(150).optional(),
    ramLimit: z.coerce.number().int().min(1024).max(65536).optional(),
    cpuLimit: z.coerce.number().int().min(100).max(800).optional(),
  }),
});

export const toggleServerPowerSchema = z.object({
  body: z.object({
    action: z.enum(["start", "stop", "restart", "kill"], {
      message: "Action must be start, stop, restart, or kill",
    }),
  }),
});

export type CreateServerInput = z.infer<typeof createServerSchema>["body"];
export type UpdateServerInput = z.infer<typeof updateServerSchema>["body"];
export type ToggleServerPowerInput = z.infer<typeof toggleServerPowerSchema>["body"];
