import "reflect-metadata";
import "dotenv/config";

import http from "http";
import app from "@/app";
import { initSocketIO } from "@/lib/socket";

const PORT = process.env.BACKEND_PORT || 8000;

const server = http.createServer(app);

// Initialize Socket.io
initSocketIO(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
