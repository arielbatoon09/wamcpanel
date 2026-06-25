import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException } from "@/exceptions";
import { toServerResponse } from "@/utils/server-mapper";
import { readServerProperties } from "@/utils/server-properties";

@injectable()
export class GetServerService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) {}

  public async execute(id: string, userId: string) {
    const server = await this.serverRepository.findByIdAndUserId(id, userId);
    if (!server) {
      throw new NotFoundException("Server not found");
    }

    const settings = await readServerProperties(id);

    return {
      message: "Server retrieved successfully",
      data: {
        server: {
          ...toServerResponse(server),
          settings,
        },
      },
    };
  }
}
