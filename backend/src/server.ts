import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import http from "http";
import app from "@/app";
import { initSocketIO } from "@/lib/socket";

const PORT = process.env.PORT || process.env.BACKEND_PORT || 8000;

const server = http.createServer(app);

// Initialize Socket.io
initSocketIO(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
