import { Router } from "express";
import { container } from "@/lib/container";
import { ServerController } from "@/controllers/server-controller";
import { FileController } from "@/controllers/file-controller";
import { PlayerController } from "@/controllers/player-controller";
import { PluginController } from "@/controllers/plugin-controller";
import { BackupController } from "@/controllers/backup-controller";
import { ActivityLogController } from "@/controllers/activity-log-controller";
import { SchemaMiddleware, AuthMiddleware } from "@/middlewares";
import { createServerSchema, updateServerSchema, toggleServerPowerSchema } from "@/schemas/server-schemas";
import { createFileSchema, writeFileSchema, extractZipSchema, compressSchema, deleteBulkSchema, renameFileSchema } from "@/schemas/file-schemas";
import { kickPlayerSchema, toggleOpSchema } from "@/schemas/player-schemas";
import { togglePluginSchema, deletePluginSchema } from "@/schemas/plugin-schemas";

const router = Router();
const serverController = container.resolve(ServerController);
const fileController = container.resolve(FileController);
const playerController = container.resolve(PlayerController);
const pluginController = container.resolve(PluginController);
const backupController = container.resolve(BackupController);
const activityLogController = container.resolve(ActivityLogController);

// Apply AuthMiddleware globally to all server routes
router.use(AuthMiddleware.execute);

router.get("/v1", serverController.list);
router.get("/v1/meta/versions", serverController.getVersions);
router.get("/v1/meta/builds/:version", serverController.getBuilds);
router.get("/v1/:id", serverController.get);
router.post("/v1", SchemaMiddleware.validate(createServerSchema), serverController.create);
router.put("/v1/:id", SchemaMiddleware.validate(updateServerSchema), serverController.update);
router.delete("/v1/:id", serverController.delete);
router.post("/v1/:id/power", SchemaMiddleware.validate(toggleServerPowerSchema), serverController.togglePower);

// File Manager routes
router.get("/v1/:id/files", fileController.list);
router.get("/v1/:id/files/view", fileController.view);
router.post("/v1/:id/files/write", SchemaMiddleware.validate(writeFileSchema), fileController.write);
router.post("/v1/:id/files/create", SchemaMiddleware.validate(createFileSchema), fileController.create);
router.post("/v1/:id/files/upload", fileController.upload);
router.post("/v1/:id/files/extract", SchemaMiddleware.validate(extractZipSchema), fileController.extract);
router.post("/v1/:id/files/compress", SchemaMiddleware.validate(compressSchema), fileController.compress);
router.post("/v1/:id/files/delete-bulk", SchemaMiddleware.validate(deleteBulkSchema), fileController.deleteBulk);
router.post("/v1/:id/files/rename", SchemaMiddleware.validate(renameFileSchema), fileController.rename);
router.delete("/v1/:id/files", fileController.delete);

// Player routes
router.get("/v1/:id/players", playerController.list);
router.post("/v1/:id/players/kick", SchemaMiddleware.validate(kickPlayerSchema), playerController.kick);
router.post("/v1/:id/players/op", SchemaMiddleware.validate(toggleOpSchema), playerController.toggleOp);

// Plugin routes
router.get("/v1/:id/plugins", pluginController.list);
router.post("/v1/:id/plugins/toggle", SchemaMiddleware.validate(togglePluginSchema), pluginController.toggle);
router.post("/v1/:id/plugins/upload", pluginController.upload);
router.delete("/v1/:id/plugins", SchemaMiddleware.validate(deletePluginSchema), pluginController.delete);

// Backup routes
router.get("/v1/:id/backups", backupController.list);
router.post("/v1/:id/backups", backupController.create);
router.post("/v1/:id/backups/upload", backupController.upload);
router.post("/v1/:id/backups/:filename/restore", backupController.restore);
router.get("/v1/:id/backups/:filename/download", backupController.download);
router.delete("/v1/:id/backups/:filename", backupController.delete);

// Activity Log routes
router.get("/v1/:id/activity-logs", activityLogController.list);

export default router;
