import { Router } from "express";
import { container } from "@/lib/container";
import { SystemController } from "@/controllers/system-controller";
import { AuthMiddleware } from "@/middlewares";

const router = Router();
const systemController = container.resolve(SystemController);

// Apply AuthMiddleware globally to all system routes
router.use(AuthMiddleware.execute);

router.get("/v1/update/check", systemController.check);
router.post("/v1/update", systemController.update);

export default router;
