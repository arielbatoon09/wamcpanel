import { z } from "zod";

export const loginWithEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

export type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>["body"];
