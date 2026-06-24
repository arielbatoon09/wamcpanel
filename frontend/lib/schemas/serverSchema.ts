import { z } from "zod";

export const serverCreateSchema = z.object({
  name: z.string().min(3, "Server name must be at least 3 characters").max(30, "Server name must be under 30 characters"),
  description: z.string().max(150, "Description must be under 150 characters").default(""),
  software: z.enum(["Vanilla", "Paper", "Forge", "Velocity"], {
    message: "Please select a valid server software",
  }),
  version: z.string().min(1, "Version is required"),
  port: z.coerce.number().int().min(1024, "Port must be >= 1024").max(65535, "Port must be <= 65535"),
  ramLimit: z.coerce.number().int().min(1024, "RAM limit must be at least 1024MB (1GB)").max(65536, "RAM limit must be <= 64GB (65536MB)"),
  cpuLimit: z.coerce.number().int().min(100, "CPU limit must be at least 100% (1 Core)").max(800, "CPU limit must be <= 800% (8 Cores)"),
  host: z.string().min(3, "Host is required").default("localhost"),
  javaVersion: z.enum(["17", "21", "25"]).default("21"),
});

export type ServerCreateInput = z.infer<typeof serverCreateSchema>;
