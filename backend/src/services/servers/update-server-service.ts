import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException } from "@/exceptions";
import { toServerResponse } from "@/utils/server-mapper";
import { writeServerProperties, readServerProperties } from "@/utils/server-properties";

@injectable()
export class UpdateServerService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) {}

  public async execute(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      ramLimit?: number;
      cpuLimit?: number;
      javaVersion?: string;
      version?: string;
      settings?: Record<string, any>;
    }
  ) {
    const existing = await this.serverRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }

    const { settings, ...dbData } = data;

    if (settings) {
      await writeServerProperties(id, settings);
    }

    const updated = await this.serverRepository.update(id, userId, dbData);
    const updatedSettings = await readServerProperties(id);

    return {
      message: "Server updated successfully",
      data: {
        server: {
          ...toServerResponse(updated),
          settings: updatedSettings,
        },
      },
    };
  }
}
