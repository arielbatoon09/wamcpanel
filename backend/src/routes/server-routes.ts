import { Router } from "express";
import { container } from "@/lib/container";
import { ServerController } from "@/controllers/server-controller";
import { SchemaMiddleware, AuthMiddleware } from "@/middlewares";
import { createServerSchema, updateServerSchema, toggleServerPowerSchema } from "@/schemas/server-schemas";

const router = Router();
const serverController = container.resolve(ServerController);

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

export default router;
