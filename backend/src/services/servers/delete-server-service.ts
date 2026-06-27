import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException, BadRequestException } from "@/exceptions";
import { docker } from "@/lib/docker";
import { deleteServerDirectory } from "@/utils/server-path";

@injectable()
export class DeleteServerService {
  constructor(@inject(ServerRepository) private readonly serverRepository: ServerRepository) { }

  public async execute(id: string, userId: string, name?: string) {
    const existing = await this.serverRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }

    if (name !== undefined && existing.name !== name) {
      throw new BadRequestException("Confirmation server name does not match");
    }

    // Delete Docker Container
    try {
      const containerName = `wamc-server-${id}`;
      const container = docker.getContainer(containerName);
      // Remove container forcing shutdown if running
      await container.remove({ force: true });
    } catch (dockerError: any) {
      if (dockerError?.statusCode === 404) {
        console.warn(`Docker container wamc-server-${id} did not exist, skipped removal.`);
      } else {
        console.warn(`Docker container removal failed for server ${id}:`, dockerError);
      }
    }

    // Delete Host Volume Directory
    try {
      deleteServerDirectory(id);
    } catch (dirError) {
      console.error(`Failed to delete server storage directory for server ${id}:`, dirError);
    }

    await this.serverRepository.delete(id, userId);

    return {
      message: "Server deleted successfully",
    };
  }
}
