import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";

const app = express();

app.set("trust proxy", true);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(cookieParser());

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

export default app;
