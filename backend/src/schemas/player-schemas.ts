import { z } from "zod";

export const kickPlayerSchema = z.object({
  body: z.object({
    player: z.string().min(1, "Player name is required").max(50, "Player name is too long"),
  }),
});

export const toggleOpSchema = z.object({
  body: z.object({
    player: z.string().min(1, "Player name is required").max(50, "Player name is too long"),
    op: z.boolean(),
  }),
});

export type KickPlayerInput = z.infer<typeof kickPlayerSchema>["body"];
export type ToggleOpInput = z.infer<typeof toggleOpSchema>["body"];
