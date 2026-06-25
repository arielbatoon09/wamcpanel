import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException } from "@/exceptions";

@injectable()
export class DeleteServerService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) {}

  public async execute(id: string, userId: string) {
    const existing = await this.serverRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }

    await this.serverRepository.delete(id, userId);

    return {
      message: "Server deleted successfully",
    };
  }
}
