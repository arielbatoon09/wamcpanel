import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { ServerSoftware } from "../../../generated/prisma/client";
import { toServerResponse } from "@/utils/server-mapper";

@injectable()
export class CreateServerService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) {}

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


