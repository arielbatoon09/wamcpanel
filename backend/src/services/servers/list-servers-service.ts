import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { toServerResponse } from "@/utils/server-mapper";

@injectable()
export class ListServersService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) {}

  public async execute(userId: string) {
    const servers = await this.serverRepository.findAllByUserId(userId);

    return {
      message: "Servers retrieved successfully",
      data: { servers: servers.map(toServerResponse) },
    };
  }
}
