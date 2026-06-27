import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { docker } from "@/lib/docker";
import { Readable } from "stream";
import { container } from "tsyringe";
import type { PrismaClient } from "@prisma/client";

const logsClearedTimestamps = new Map<string, number>();

export function initSocketIO(server: HTTPServer) {
  const prisma = container.resolve<PrismaClient>("PrismaClient");
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    let logStream: Readable | null = null;
    let currentServerId: string | null = null;
    let retryTimer: NodeJS.Timeout | null = null;
    let lastSystemMessage: string | null = null;

    const cleanUpStream = () => {
      if (logStream) {
        logStream.destroy();
        logStream = null;
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const emitSystemMessage = (serverId: string, line: string) => {
      const msgKey = `${serverId}:${line}`;
      if (lastSystemMessage !== msgKey) {
        socket.emit("log-line", { serverId, line });
        lastSystemMessage = msgKey;
      }
    };

    const attachLogStream = async (serverId: string) => {
      if (currentServerId !== serverId || socket.disconnected) {
        cleanUpStream();
        return;
      }

      const containerName = `wamc-server-${serverId}`;
      const container = docker.getContainer(containerName);

      try {
        await container.inspect();

        const clearedAt = logsClearedTimestamps.get(serverId);
        const logOptions: any = {
          follow: true,
          stdout: true,
          stderr: true,
          tail: 150,
        };
        if (clearedAt) {
          logOptions.since = clearedAt;
        }

        const stream = (await container.logs(logOptions)) as unknown as Readable;

        if (currentServerId !== serverId || socket.disconnected) {
          stream.destroy();
          return;
        }

        cleanUpStream();
        logStream = stream;
        lastSystemMessage = null; // Reset system messages tracking on successful attach

        stream.on("data", (chunk: Buffer) => {
          if (currentServerId !== serverId || socket.disconnected) {
            stream.destroy();
            return;
          }

          let text = chunk.toString("utf8");
          if (chunk.length >= 8 && (chunk[0] === 1 || chunk[0] === 2) && chunk[1] === 0 && chunk[2] === 0 && chunk[3] === 0) {
            text = chunk.subarray(8).toString("utf8");
          }

          const lines = text.split(/\r?\n/);
          for (const line of lines) {
            if (line.trim()) {
              // Silence spammy RCON client connection/disconnection logs from local metrics polling
              if (line.includes("Thread RCON Client") && (line.includes("started") || line.includes("shutting down"))) {
                continue;
              }
              socket.emit("log-line", { serverId, line });
            }
          }
        });

        stream.on("error", err => {
          console.error(`Log stream error for ${serverId}:`, err);
          handleStreamEnd(serverId);
        });

        stream.on("end", () => {
          handleStreamEnd(serverId);
        });
      } catch (err: any) {
        handleStreamEnd(serverId);
        console.error(err);
      }
    };

    const pollServerStatus = async (serverId: string) => {
      if (currentServerId !== serverId || socket.disconnected) {
        return;
      }

      try {
        const dbServer = await prisma.server.findUnique({
          where: { id: serverId },
        });
        if (dbServer && dbServer.status !== "OFFLINE") {
          attachLogStream(serverId);
        } else {
          retryTimer = setTimeout(() => {
            pollServerStatus(serverId);
          }, 3000);
        }
      } catch (err) {
        retryTimer = setTimeout(() => {
          pollServerStatus(serverId);
        }, 5000);
        console.error(err);
      }
    };

    const handleStreamEnd = async (serverId: string) => {
      cleanUpStream();
      if (currentServerId !== serverId || socket.disconnected) {
        return;
      }

      try {
        const dbServer = await prisma.server.findUnique({
          where: { id: serverId },
        });
        if (!dbServer || dbServer.status === "OFFLINE") {
          emitSystemMessage(serverId, `[SYSTEM] Server is offline. Log stream closed.`);
          retryTimer = setTimeout(() => {
            pollServerStatus(serverId);
          }, 3000);
          return;
        }
      } catch (err) {
        retryTimer = setTimeout(() => {
          attachLogStream(serverId);
        }, 5000);
        return;
        console.error(err);
      }

      emitSystemMessage(serverId, `[SYSTEM] Log stream ended. Waiting for container to start...`);

      retryTimer = setTimeout(() => {
        attachLogStream(serverId);
      }, 2000);
    };

    socket.on("subscribe-logs", async (serverId: string) => {
      console.log(`Socket ${socket.id} subscribed to logs of server ${serverId}`);
      currentServerId = serverId;
      lastSystemMessage = null; // Reset system messages tracking on new subscription
      cleanUpStream();
      attachLogStream(serverId);
    });

    socket.on("clear-logs", (serverId: string) => {
      console.log(`Logs cleared for server ${serverId}`);
      logsClearedTimestamps.set(serverId, Math.floor(Date.now() / 1000));
    });

    socket.on("send-command", async ({ serverId, command }: { serverId: string; command: string }) => {
      console.log(`Sending command to server ${serverId}: ${command}`);
      const containerName = `wamc-server-${serverId}`;
      const container = docker.getContainer(containerName);

      try {
        const inspect = await container.inspect();
        if (!inspect.State.Running) {
          socket.emit("log-line", { serverId, line: `[SYSTEM] Cannot send command. Server is offline.` });
          return;
        }

        const exec = await container.exec({
          Cmd: ["mc-send-to-console", command],
          User: "1000",
          AttachStdout: true,
          AttachStderr: true,
        });

        const execStream = await exec.start({});

        let output = "";
        execStream.on("data", (chunk: Buffer) => {
          let text = chunk.toString("utf8");
          // Clean Docker multiplexing header if present
          if (chunk.length >= 8 && (chunk[0] === 1 || chunk[0] === 2) && chunk[1] === 0 && chunk[2] === 0 && chunk[3] === 0) {
            text = chunk.subarray(8).toString("utf8");
          }
          output += text;
        });

        execStream.on("end", () => {
          if (output.trim()) {
            console.log(`Command output: ${output.trim()}`);
            socket.emit("log-line", { serverId, line: `[SYSTEM] Command feedback: ${output.trim()}` });
          }
        });
      } catch (err: any) {
        console.error("Failed to execute command:", err);
        socket.emit("log-line", { serverId, line: `[SYSTEM ERROR] Failed to execute command: ${err.message}` });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      cleanUpStream();
    });
  });

  return io;
}
