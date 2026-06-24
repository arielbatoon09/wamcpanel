import { z } from "zod";

export const signupWithEmailSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional().nullable(),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export type SignupWithEmailInput = z.infer<typeof signupWithEmailSchema>["body"];
