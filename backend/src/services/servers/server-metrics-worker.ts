import { injectable, inject } from "tsyringe";
import type { PrismaClient } from "@prisma/client";
import { ServerStatus } from "@/lib/prisma";
import { docker } from "@/lib/docker";

@injectable()
export class ServerMetricsWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isTicking = false;

  constructor(@inject("PrismaClient") private readonly prisma: PrismaClient) { }

  public start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), 4000);
    console.log("Server metrics worker initialized and started.");
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async tick() {
    if (this.isTicking) return;
    this.isTicking = true;

    try {
      const servers = await this.prisma.server.findMany();

      for (const server of servers) {
        const containerName = `wamc-server-${server.id}`;
        const container = docker.getContainer(containerName);

        try {
          const inspect = await container.inspect();

          if (inspect.State.Running) {
            // Container is running
            const startedAt = new Date(inspect.State.StartedAt).getTime();
            const uptime = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

            // Get Stats
            let cpuUsage = 0;
            let ramUsage = 0;

            try {
              const stats = await container.stats({ stream: false });

              // RAM usage in MB
              if (stats.memory_stats && stats.memory_stats.usage) {
                ramUsage = Math.round(stats.memory_stats.usage / (1024 * 1024));
              }

              // CPU usage percentage
              if (stats.cpu_stats && stats.precpu_stats) {
                const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
                const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
                if (systemDelta > 0 && cpuDelta > 0) {
                  cpuUsage = (cpuDelta / systemDelta) * (stats.cpu_stats.online_cpus || 1) * 100;
                  cpuUsage = Math.min(100, Math.round(cpuUsage * 10) / 10);
                }
              }
            } catch (statsErr) {
              // fallback values if stats call fails (e.g. windows docker desktop latency)
              cpuUsage = server.status === "STARTING" ? 85 : 5;
              ramUsage = Math.floor(server.ramLimit * 0.4);
              console.log(statsErr);
            }

            // Try to get actual JVM memory usage via jcmd
            let jvmRamUsage = 0;
            try {
              const execJcmd = await container.exec({
                Cmd: ["jcmd", "1", "GC.heap_info"],
                AttachStdout: true,
                AttachStderr: true,
              });
              const jcmdStream = await execJcmd.start({});
              const jcmdOutput = await new Promise<string>((resolve, reject) => {
                let output = "";
                jcmdStream.on("data", (chunk: Buffer) => {
                  let text = chunk.toString("utf8");
                  if (chunk.length >= 8 && (chunk[0] === 1 || chunk[0] === 2) && chunk[1] === 0 && chunk[2] === 0 && chunk[3] === 0) {
                    text = chunk.subarray(8).toString("utf8");
                  }
                  output += text;
                });
                jcmdStream.on("end", () => resolve(output));
                jcmdStream.on("error", reject);
              });

              // Look for "used <digits><unit>" under heap info
              const usedMatch = jcmdOutput.match(/used\s+(\d+)([KMG])/i);
              if (usedMatch) {
                const val = parseInt(usedMatch[1], 10);
                const unit = usedMatch[2].toUpperCase();
                if (unit === "K") {
                  jvmRamUsage = Math.round(val / 1024);
                } else if (unit === "M") {
                  jvmRamUsage = val;
                } else if (unit === "G") {
                  jvmRamUsage = val * 1024;
                }
              }
            } catch (err: any) {
              console.error(`[Metrics] Failed to run jcmd for server ${server.name}:`, err.message || err);
            }

            if (jvmRamUsage > 0) {
              ramUsage = jvmRamUsage;
            }

            // Get player count via RCON list command
            // Skip for Velocity (proxy — no RCON) and non-ONLINE servers (prevents connection flood during startup)
            let currentPlayers = 0;
            let maxPlayers = server.maxPlayers;
            let status = server.status;

            const isVelocity = server.software === "Velocity";

            if (status === ServerStatus.OFFLINE) {
              status = isVelocity ? ServerStatus.ONLINE : ServerStatus.STARTING;
            } else if (isVelocity && status === ServerStatus.STARTING) {
              status = ServerStatus.ONLINE;
            }

            const canRunRcon = !isVelocity && (status === ServerStatus.ONLINE || status === ServerStatus.STARTING);

            if (canRunRcon) {
              try {
                const exec = await container.exec({
                  Cmd: ["rcon-cli", "list"],
                  User: "1000",
                  AttachStdout: true,
                  AttachStderr: true,
                });

                const execStream = await exec.start({});
                const rawOutput = await new Promise<string>((resolve, reject) => {
                  let output = "";
                  execStream.on("data", (chunk: Buffer) => {
                    let text = chunk.toString("utf8");
                    if (chunk.length >= 8 && (chunk[0] === 1 || chunk[0] === 2) && chunk[1] === 0 && chunk[2] === 0 && chunk[3] === 0) {
                      text = chunk.subarray(8).toString("utf8");
                    }
                    output += text;
                  });
                  execStream.on("end", () => resolve(output.trim()));
                  execStream.on("error", reject);
                });

                // e.g. "There are 1 of a max of 20 players online: Maezt"
                const match = rawOutput.match(/There are (\d+) of a max of (\d+) players/);
                if (match) {
                  currentPlayers = parseInt(match[1], 10);
                  maxPlayers = parseInt(match[2], 10);
                  // If list command succeeds, server is ONLINE
                  status = ServerStatus.ONLINE;
                }
              } catch (rconErr) {
                // If RCON fails and we were STARTING, stay starting
                console.log(rconErr);
              }
            }

            await this.prisma.server.update({
              where: { id: server.id },
              data: {
                status,
                cpuUsage,
                ramUsage,
                uptime,
                currentPlayers,
                maxPlayers,
              },
            });
          } else {
            // Container exists but is NOT running
            if (server.status !== ServerStatus.OFFLINE && server.status !== ServerStatus.STARTING && server.status !== ServerStatus.STOPPING) {
              await this.prisma.server.update({
                where: { id: server.id },
                data: {
                  status: ServerStatus.OFFLINE,
                  cpuUsage: 0,
                  ramUsage: 0,
                  uptime: 0,
                  currentPlayers: 0,
                },
              });
            }
          }
        } catch (inspectErr: any) {
          // Container inspect failed -> container doesn't exist
          if (server.status !== ServerStatus.OFFLINE && server.status !== ServerStatus.STARTING && server.status !== ServerStatus.STOPPING) {
            await this.prisma.server.update({
              where: { id: server.id },
              data: {
                status: ServerStatus.OFFLINE,
                cpuUsage: 0,
                ramUsage: 0,
                uptime: 0,
                currentPlayers: 0,
              },
            });
          }
          if (inspectErr.statusCode !== 404 && inspectErr.reason !== "no such container") {
            console.error(`Error inspecting container for server ${server.name}:`, inspectErr);
          }
        }
      }
    } catch (err) {
      console.error("Error in server metrics worker tick:", err);
    } finally {
      this.isTicking = false;
    }
  }
}
