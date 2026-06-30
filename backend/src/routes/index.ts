import express from "express";
import authRouter from "@/routes/auth-routes";
import serverRouter from "@/routes/server-routes";
import systemRouter from "@/routes/system-routes";

const router = express.Router();

// Mount Feature Routers
router.use("/auth", authRouter);
router.use("/servers", serverRouter);
router.use("/system", systemRouter);

export default router;
