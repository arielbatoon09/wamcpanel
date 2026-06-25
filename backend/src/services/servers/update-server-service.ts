import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException } from "@/exceptions";
import { toServerResponse } from "@/utils/server-mapper";

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
    }
  ) {
    const existing = await this.serverRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }

    const updated = await this.serverRepository.update(id, userId, data);

    return {
      message: "Server updated successfully",
      data: { server: toServerResponse(updated) },
    };
  }
}
