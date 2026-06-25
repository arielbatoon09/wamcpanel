import express from "express";
import authRouter from "@/routes/auth-routes";
import serverRouter from "@/routes/server-routes";

const router = express.Router();

// Mount Feature Routers
router.use("/auth", authRouter);
router.use("/servers", serverRouter);

export default router;
