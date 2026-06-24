import { z } from "zod";

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>["body"];
