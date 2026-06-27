import { Router } from "express";
import { container } from "@/lib/container";
import { AuthController } from "@/controllers/auth-controller";
import { SchemaMiddleware, AuthMiddleware } from "@/middlewares";
import { signupWithEmailSchema, loginWithEmailSchema, refreshTokenSchema, updateProfileSchema } from "@/schemas/auth";

const router = Router();
const authController = container.resolve(AuthController);

router.get("/v1/onboarding-status", authController.onboardingStatus);
router.get("/v1/me", AuthMiddleware.execute, authController.me);

router.post("/v1/signup", SchemaMiddleware.validate(signupWithEmailSchema), authController.signup);

router.post("/v1/login", SchemaMiddleware.validate(loginWithEmailSchema), authController.login);

router.post("/v1/refresh-token", SchemaMiddleware.validate(refreshTokenSchema), authController.refreshToken);

router.post("/v1/logout", authController.logout);

router.patch("/v1/profile", AuthMiddleware.execute, SchemaMiddleware.validate(updateProfileSchema), authController.updateProfile);

export default router;
