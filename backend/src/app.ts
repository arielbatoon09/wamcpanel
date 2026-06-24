import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";
import apiRouter from "@/routes";
import { sendError } from "@/utils/apiResponse";
import { HttpException } from "@/exceptions";

const app = express();

app.set("trust proxy", true);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(cookieParser());

// Mount apiRouter
app.use("/api", apiRouter);

app.get("/api/status", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Backend initial setup is running successfully.",
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.redirect("/api/status");
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpException) {
    return sendError({
      res,
      message: err.message,
      statusCode: err.statusCode,
      errors: err.errors,
    });
  }

  sendError({
    res,
    message: err.message || "Internal Server Error",
    statusCode: 500,
    error: err,
  });
});

export default app;
