import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import type { ServerSoftware } from "@prisma/client";
import { toServerResponse } from "@/utils/server-mapper";
import { BadRequestException } from "@/exceptions";

@injectable()
export class CreateServerService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) { }

  public async execute(
    userId: string,
    data: {
      name: string;
      description?: string;
      software: "Vanilla" | "Paper" | "Modpack" | "Fabric" | "Bedrock" | "Forge" | "NeoForge" | "Quilt" | "Velocity";
      version: string;
      buildNumber?: string;
      port: number;
      ramLimit: number;
      cpuLimit: number;
      javaVersion: string;
      worldSeed?: string;
      worldType?: string;
      generateStructures?: boolean;
    }
  ) {
    // Prevent duplicate server names
    const nameInUse = await this.serverRepository.findByName(data.name);
    if (nameInUse) {
      throw new BadRequestException(`Server name "${data.name}" is already in use. Please choose a unique name.`);
    }

    // Prevent duplicate port bindings across all servers
    const portInUse = await this.serverRepository.findByPort(data.port);
    if (portInUse) {
      throw new BadRequestException(`Port ${data.port} is already in use by server "${portInUse.name}". Please choose a different port.`);
    }

    const maxPlayers = data.software === "Velocity" ? 500 : 50;

    const server = await this.serverRepository.create({
      ...data,
      description: data.description?.trim() || "A Minecraft Server",
      software: data.software as ServerSoftware,
      maxPlayers,
      userId,
    });

    return {
      message: "Server created successfully",
      data: { server: toServerResponse(server) },
    };
  }
}
