import { injectable, inject } from "tsyringe";
import type { Request, Response } from "express";
import { BaseController } from "@/controllers/base-controller";
import { AsyncController } from "@/lib/decorators";
import { CreateServerService, ListServersService, GetServerService, UpdateServerService, DeleteServerService, ToggleServerPowerService, MinecraftMetaService, HostSpecsService } from "@/services/servers";

@injectable()
export class ServerController extends BaseController {
  constructor(
    @inject(CreateServerService) private readonly createServerService: CreateServerService,
    @inject(ListServersService) private readonly listServersService: ListServersService,
    @inject(GetServerService) private readonly getServerService: GetServerService,
    @inject(UpdateServerService) private readonly updateServerService: UpdateServerService,
    @inject(DeleteServerService) private readonly deleteServerService: DeleteServerService,
    @inject(ToggleServerPowerService) private readonly toggleServerPowerService: ToggleServerPowerService,
    @inject(MinecraftMetaService) private readonly minecraftMetaService: MinecraftMetaService,
    @inject(HostSpecsService) private readonly hostSpecsService: HostSpecsService
  ) {
    super();
  }

  @AsyncController()
  async create(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { name, description, software, version, buildNumber, port, ramLimit, cpuLimit, javaVersion, worldSeed, worldType, generateStructures } = req.body;

    const result = await this.createServerService.execute(userId, {
      name,
      description,
      software,
      version,
      buildNumber,
      port,
      ramLimit,
      cpuLimit,
      javaVersion,
      worldSeed,
      worldType,
      generateStructures,
    });

    return this.ok(res, result.data, result.message);
  }

  @AsyncController()
  async list(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const result = await this.listServersService.execute(userId);
    return this.ok(res, result.data, result.message);
  }

  @AsyncController()
  async get(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const result = await this.getServerService.execute(id, userId);
    return this.ok(res, result.data, result.message);
  }

  @AsyncController()
  async update(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { name, description, ramLimit, cpuLimit, javaVersion, version, settings } = req.body;

    const result = await this.updateServerService.execute(id, userId, {
      name,
      description,
      ramLimit,
      cpuLimit,
      javaVersion,
      version,
      settings,
    });

    return this.ok(res, result.data, result.message);
  }

  @AsyncController()
  async delete(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const name = req.query.name as string | undefined;
    const result = await this.deleteServerService.execute(id, userId, name);
    return this.ok(res, undefined, result.message);
  }

  @AsyncController()
  async togglePower(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { action } = req.body;

    const result = await this.toggleServerPowerService.execute(id, userId, action);
    return this.ok(res, result.data, result.message);
  }

  @AsyncController()
  async getVersions(req: Request, res: Response) {
    const versions = await this.minecraftMetaService.getVersions();
    return this.ok(res, { versions }, "Minecraft versions retrieved successfully");
  }

  @AsyncController()
  async getBuilds(req: Request, res: Response) {
    const { version } = req.params as { version: string };
    const builds = await this.minecraftMetaService.getPaperBuilds(version);
    return this.ok(res, { builds }, "Paper builds retrieved successfully");
  }

  @AsyncController()
  async getHostSpecs(req: Request, res: Response) {
    const specs = await this.hostSpecsService.getSpecs();
    return this.ok(res, { specs }, "Host specifications retrieved successfully");
  }
}