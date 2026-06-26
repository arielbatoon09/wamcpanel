import { z } from "zod";

export const togglePluginSchema = z.object({
  body: z.object({
    pluginPath: z.string().min(1, "Plugin path is required"),
    enable: z.boolean(),
  }),
});

export const deletePluginSchema = z.object({
  body: z.object({
    pluginPath: z.string().min(1, "Plugin path is required"),
  }),
});

export type TogglePluginInput = z.infer<typeof togglePluginSchema>["body"];
export type DeletePluginInput = z.infer<typeof deletePluginSchema>["body"];
