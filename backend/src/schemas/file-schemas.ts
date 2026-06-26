import { z } from "zod";

export const createFileSchema = z.object({
  body: z.object({
    path: z.string().default(""), // parent relative folder (empty string represents server root)
    name: z.string().min(1, "Name is required").max(100, "Name must be under 100 characters"),
    isDir: z.boolean(),
  }),
});

export const writeFileSchema = z.object({
  body: z.object({
    path: z.string().min(1, "File path is required"),
    content: z.string(),
  }),
});

export const extractZipSchema = z.object({
  body: z.object({
    path: z.string().min(1, "Zip file path is required"),
    targetPath: z.string().optional().default(""),
  }),
});

export const compressSchema = z.object({
  body: z.object({
    path: z.string().default(""),
    files: z.array(z.string()).min(1, "At least one file must be selected"),
    archiveName: z.string().min(1, "Archive name is required"),
  }),
});

export const deleteBulkSchema = z.object({
  body: z.object({
    paths: z.array(z.string()).min(1, "At least one path must be specified"),
  }),
});

export const renameFileSchema = z.object({
  body: z.object({
    path: z.string().min(1, "Original path is required"),
    newName: z.string().min(1, "New name is required").max(100, "New name must be under 100 characters"),
  }),
});

export type CreateFileInput = z.infer<typeof createFileSchema>["body"];
export type WriteFileInput = z.infer<typeof writeFileSchema>["body"];
export type ExtractZipInput = z.infer<typeof extractZipSchema>["body"];
export type CompressInput = z.infer<typeof compressSchema>["body"];
export type DeleteBulkInput = z.infer<typeof deleteBulkSchema>["body"];
export type RenameFileInput = z.infer<typeof renameFileSchema>["body"];
