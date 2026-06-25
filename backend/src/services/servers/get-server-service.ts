import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException } from "@/exceptions";
import { toServerResponse } from "@/utils/server-mapper";

@injectable()
export class GetServerService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) {}

  public async execute(id: string, userId: string) {
    const server = await this.serverRepository.findByIdAndUserId(id, userId);
    if (!server) {
      throw new NotFoundException("Server not found");
    }

    return {
      message: "Server retrieved successfully",
      data: { server: toServerResponse(server) },
    };
  }
}
