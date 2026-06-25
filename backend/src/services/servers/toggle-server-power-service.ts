import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException } from "@/exceptions";
import { ServerStatus } from "../../../generated/prisma/client";
import { toServerResponse } from "@/utils/server-mapper";

@injectable()
export class ToggleServerPowerService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) {}

  public async execute(id: string, userId: string, action: "start" | "stop" | "restart" | "kill") {
    const existing = await this.serverRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }

    let updatedStatus: ServerStatus = existing.status;

    if (action === "start") {
      if (existing.status !== "OFFLINE") return { message: "Server is not offline", data: { server: toServerResponse(existing) } };
      updatedStatus = "STARTING";

      // Update DB to STARTING
      const server = await this.serverRepository.update(id, userId, {
        status: "STARTING",
        cpuUsage: 85,
        ramUsage: Math.floor(existing.ramLimit * 0.2),
      });

      // Background transition to ONLINE after 3 seconds
      setTimeout(async () => {
        try {
          await this.serverRepository.update(id, userId, {
            status: "ONLINE",
            cpuUsage: 12.4,
            ramUsage: Math.floor(existing.ramLimit * 0.5),
            uptime: 1,
          });
        } catch (e) {
          // Ignore if deleted during timer
        }
      }, 3000);

      return {
        message: "Server start sequence initiated",
        data: { server: toServerResponse(server) },
      };
    }

    if (action === "stop") {
      if (existing.status !== "ONLINE") return { message: "Server is not online", data: { server: toServerResponse(existing) } };

      // Update DB to STOPPING
      const server = await this.serverRepository.update(id, userId, {
        status: "STOPPING",
        cpuUsage: 35,
        ramUsage: Math.floor(existing.ramLimit * 0.4),
      });

      // Background transition to OFFLINE after 3 seconds
      setTimeout(async () => {
        try {
          await this.serverRepository.update(id, userId, {
            status: "OFFLINE",
            cpuUsage: 0,
            ramUsage: 0,
            uptime: 0,
          });
        } catch (e) {
          // Ignore
        }
      }, 3000);

      return {
        message: "Server stop sequence initiated",
        data: { server: toServerResponse(server) },
      };
    }

    if (action === "restart") {
      // Update DB to STOPPING
      const server = await this.serverRepository.update(id, userId, {
        status: "STOPPING",
        cpuUsage: 35,
        ramUsage: Math.floor(existing.ramLimit * 0.4),
      });

      // Stop then start
      setTimeout(async () => {
        try {
          await this.serverRepository.update(id, userId, {
            status: "OFFLINE",
            cpuUsage: 0,
            ramUsage: 0,
            uptime: 0,
          });

          setTimeout(async () => {
            await this.serverRepository.update(id, userId, {
              status: "STARTING",
              cpuUsage: 85,
              ramUsage: Math.floor(existing.ramLimit * 0.2),
            });

            setTimeout(async () => {
              await this.serverRepository.update(id, userId, {
                status: "ONLINE",
                cpuUsage: 14.8,
                ramUsage: Math.floor(existing.ramLimit * 0.55),
                uptime: 1,
              });
            }, 3000);
          }, 1500);
        } catch (e) {
          // Ignore
        }
      }, 2000);

      return {
        message: "Server restart sequence initiated",
        data: { server: toServerResponse(server) },
      };
    }

    if (action === "kill") {
      // Immediate force stop
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
