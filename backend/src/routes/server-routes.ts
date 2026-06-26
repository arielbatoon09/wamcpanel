import { Router } from "express";
import { container } from "@/lib/container";
import { ServerController } from "@/controllers/server-controller";
import { FileController } from "@/controllers/file-controller";
import { SchemaMiddleware, AuthMiddleware } from "@/middlewares";
import { createServerSchema, updateServerSchema, toggleServerPowerSchema } from "@/schemas/server-schemas";
import { createFileSchema, writeFileSchema, extractZipSchema, compressSchema, deleteBulkSchema, renameFileSchema } from "@/schemas/file-schemas";

const router = Router();
const serverController = container.resolve(ServerController);
const fileController = container.resolve(FileController);

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

export default router;
