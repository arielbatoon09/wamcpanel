import "reflect-metadata";
import "dotenv/config";

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection at:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception thrown:", error);
  process.exit(1);
});

import http from "http";
import app from "@/app";
import { initSocketIO } from "@/lib/socket";

const PORT = process.env.BACKEND_PORT || 8000;

const server = http.createServer(app);

// Initialize Socket.io
initSocketIO(server);

// Initialize SFTP Server
import { container } from "@/lib/container";
import { SftpServerService } from "@/services/servers/sftp-server-service";
const sftpServer = container.resolve(SftpServerService);
sftpServer.start();

import { ServerMetricsWorker } from "@/services/servers/server-metrics-worker";
const metricsWorker = container.resolve(ServerMetricsWorker);
metricsWorker.start();

server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});