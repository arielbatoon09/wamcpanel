import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException } from "@/exceptions";
import { toServerResponse } from "@/utils/server-mapper";
import { docker } from "@/lib/docker";
import { getServerDirectory } from "@/utils/server-path";

@injectable()
export class ToggleServerPowerService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) {}

  public async execute(id: string, userId: string, action: "start" | "stop" | "restart" | "kill") {
    const existing = await this.serverRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }

    const containerName = `wamc-server-${id}`;
    const container = docker.getContainer(containerName);

    if (action === "start") {
      if (existing.status !== "OFFLINE") {
        return { message: "Server is not offline", data: { server: toServerResponse(existing) } };
      }

      const server = await this.serverRepository.update(id, userId, {
        status: "STARTING",
        cpuUsage: 85,
        ramUsage: Math.floor(existing.ramLimit * 0.2),
      });

      // Background setup and start process to avoid API timeout
      (async () => {
        try {
          let containerExists = false;
          try {
            await container.inspect();
            containerExists = true;
          } catch (inspectError: any) {
            if (inspectError.statusCode !== 404) {
              throw inspectError;
            }
          }

          if (!containerExists) {
            const image = "itzg/minecraft-server:latest";
            
            // Pull image
            await new Promise<void>((resolve, reject) => {
              docker.pull(image, {}, (err, stream) => {
                if (err) return reject(err);
                if (!stream) return reject(new Error("No stream returned from docker pull"));
                docker.modem.followProgress(stream, (followErr) => {
                  if (followErr) reject(followErr);
                  else resolve();
                });
              });
            });

            // Create container
            const hostDir = getServerDirectory(id);
            const Env = [
              "EULA=TRUE",
              `TYPE=${existing.software.toUpperCase()}`,
              `VERSION=${existing.version}`,
              `ONLINE_MODE=FALSE`,
            ];

            if (existing.worldSeed) {
              Env.push(`SEED=${existing.worldSeed}`);
            }
            if (existing.worldType) {
              Env.push(`LEVEL_TYPE=${existing.worldType}`);
            }
            if (existing.generateStructures !== undefined) {
              Env.push(`GENERATE_STRUCTURES=${existing.generateStructures ? "TRUE" : "FALSE"}`);
            }

            const ramGb = Math.floor(existing.ramLimit / 1024);
            Env.push(`MEMORY=${ramGb > 0 ? `${ramGb}G` : `${existing.ramLimit}M`}`);

            await docker.createContainer({
              Image: image,
              name: containerName,
              Env,
              ExposedPorts: {
                "25565/tcp": {},
              },
              HostConfig: {
                PortBindings: {
                  "25565/tcp": [
                    {
                      HostPort: existing.port.toString(),
                    },
                  ],
                },
                Binds: [
                  `${hostDir}:/data`,
                ],
                Memory: existing.ramLimit * 1024 * 1024,
                NanoCpus: existing.cpuLimit * 10000000,
              },
            });
          }

          // Start the container
          await container.start();

          // Wait 5 seconds and update status to ONLINE
          setTimeout(async () => {
            try {
              const inspectData = await container.inspect();
              if (inspectData.State.Running) {
                await this.serverRepository.update(id, userId, {
                  status: "ONLINE",
                  cpuUsage: 12.4,
                  ramUsage: Math.floor(existing.ramLimit * 0.5),
                  uptime: 1,
                });
              } else {
                await this.serverRepository.update(id, userId, {
                  status: "OFFLINE",
                  cpuUsage: 0,
                  ramUsage: 0,
                  uptime: 0,
                });
              }
            } catch (inspectErr) {
              console.error("Failed to inspect container post-start:", inspectErr);
              await this.serverRepository.update(id, userId, {
                status: "OFFLINE",
                cpuUsage: 0,
                ramUsage: 0,
                uptime: 0,
              }).catch(() => {});
            }
          }, 5000);

        } catch (backgroundError) {
          console.error("Background server startup failed:", backgroundError);
          await this.serverRepository.update(id, userId, {
            status: "OFFLINE",
            cpuUsage: 0,
            ramUsage: 0,
            uptime: 0,
          }).catch(() => {});
        }
      })();

      return {
        message: "Server start sequence initiated",
        data: { server: toServerResponse(server) },
      };
    }

    if (action === "stop") {
      if (existing.status !== "ONLINE" && existing.status !== "STARTING") {
        return { message: "Server is not running", data: { server: toServerResponse(existing) } };
      }

      const server = await this.serverRepository.update(id, userId, {
        status: "STOPPING",
        cpuUsage: 35,
        ramUsage: Math.floor(existing.ramLimit * 0.4),
      });

      // Trigger docker stop
      container.stop().then(async () => {
        try {
          await this.serverRepository.update(id, userId, {
            status: "OFFLINE",
            cpuUsage: 0,
            ramUsage: 0,
            uptime: 0,
          });
        } catch (e) {}
      }).catch(async () => {
        // If container stop fails (e.g. already stopped), set to offline
        try {
          await this.serverRepository.update(id, userId, {
            status: "OFFLINE",
            cpuUsage: 0,
            ramUsage: 0,
            uptime: 0,
          });
        } catch (e) {}
      });

      return {
        message: "Server stop sequence initiated",
        data: { server: toServerResponse(server) },
      };
    }

    if (action === "restart") {
      const server = await this.serverRepository.update(id, userId, {
        status: "STOPPING",
        cpuUsage: 35,
        ramUsage: Math.floor(existing.ramLimit * 0.4),
      });

      container.restart().then(async () => {
        try {
          await this.serverRepository.update(id, userId, {
            status: "STARTING",
            cpuUsage: 85,
            ramUsage: Math.floor(existing.ramLimit * 0.2),
          });
          setTimeout(async () => {
            try {
              const inspectData = await container.inspect();
              if (inspectData.State.Running) {
                await this.serverRepository.update(id, userId, {
                  status: "ONLINE",
                  cpuUsage: 14.8,
                  ramUsage: Math.floor(existing.ramLimit * 0.55),
                  uptime: 1,
                });
              }
            } catch (e) {}
          }, 5000);
        } catch (e) {}
      }).catch(async () => {
        // Fallback
        try {
          await this.serverRepository.update(id, userId, {
            status: "OFFLINE",
            cpuUsage: 0,
            ramUsage: 0,
            uptime: 0,
          });
        } catch (e) {}
      });

      return {
        message: "Server restart sequence initiated",
        data: { server: toServerResponse(server) },
      };
    }

    if (action === "kill") {
      await container.kill().catch(() => {});

      const server = await this.serverRepository.update(id, userId, {
        status: "OFFLINE",
        cpuUsage: 0,
        ramUsage: 0,
        uptime: 0,
      });

      return {
        message: "Server killed successfully",
        data: { server: toServerResponse(server) },
      };
    }

    return {
      message: "Invalid action",
      data: { server: toServerResponse(existing) },
    };
  }
}
