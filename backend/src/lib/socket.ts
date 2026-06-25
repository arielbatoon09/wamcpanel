import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { docker } from "@/lib/docker";
import { Readable } from "stream";

export function initSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    let logStream: Readable | null = null;

    socket.on("subscribe-logs", async (serverId: string) => {
      console.log(`Socket ${socket.id} subscribed to logs of server ${serverId}`);
      
      // Clean up previous stream if any
      if (logStream) {
        logStream.destroy();
        logStream = null;
      }

      const containerName = `wamc-server-${serverId}`;
      const container = docker.getContainer(containerName);

      try {
        await container.inspect();

        // Fetch logs (last 150 lines, and follow new lines)
        const stream = await container.logs({
          follow: true,
          stdout: true,
          stderr: true,
          tail: 150,
        }) as Readable;

        logStream = stream;

        stream.on("data", (chunk: Buffer) => {
          let text = chunk.toString("utf8");
          
          // Docker logs stream is multiplexed: each frame starts with an 8-byte header:
          // [streamType (1 = stdout, 2 = stderr), 0, 0, 0, size1, size2, size3, size4]
          if (
            chunk.length >= 8 &&
            (chunk[0] === 1 || chunk[0] === 2) &&
            chunk[1] === 0 &&
            chunk[2] === 0 &&
            chunk[3] === 0
          ) {
            text = chunk.subarray(8).toString("utf8");
          }

          // Emit clean text line by line
          const lines = text.split(/\r?\n/);
          for (const line of lines) {
            if (line.trim()) {
              socket.emit("log-line", { serverId, line });
            }
          }
        });

        stream.on("error", (err) => {
          socket.emit("log-line", { serverId, line: `[SYSTEM ERROR] Failed to stream logs: ${err.message}` });
        });

        stream.on("end", () => {
          socket.emit("log-line", { serverId, line: `[SYSTEM] Log stream ended.` });
        });

      } catch (err: any) {
        socket.emit("log-line", { serverId, line: `[SYSTEM] Console offline. Container is not running.` });
      }
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
          AttachStdout: true,
          AttachStderr: true,
        });

        const execStream = await exec.start({});
        // Execute stream reads but we don't need output as logs are tracked by subscribe-logs
      } catch (err: any) {
        console.error("Failed to execute command:", err);
        socket.emit("log-line", { serverId, line: `[SYSTEM ERROR] Failed to execute command: ${err.message}` });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (logStream) {
        logStream.destroy();
        logStream = null;
      }
    });
  });

  return io;
}
