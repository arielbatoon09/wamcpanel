import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters").optional(),
      currentPassword: z.string().min(1, "Current password is required").optional(),
      newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
    })
    .refine(
      (data) => {
        // If newPassword is provided, currentPassword must also be provided
        if (data.newPassword && !data.currentPassword) return false;
        return true;
      },
      {
        message: "Current password is required when changing your password",
        path: ["currentPassword"],
      }
    ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
