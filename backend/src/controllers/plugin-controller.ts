import { injectable, inject } from "tsyringe";
import type { Request, Response } from "express";
import { BaseController } from "@/controllers/base-controller";
import { AsyncController } from "@/lib/decorators";
import { PluginService } from "@/services/servers/plugin-service";
import { BadRequestException } from "@/exceptions";

@injectable()
export class PluginController extends BaseController {
  constructor(
    @inject(PluginService) private readonly pluginService: PluginService
  ) {
    super();
  }

  @AsyncController()
  async list(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };

    const plugins = await this.pluginService.listPlugins(id, userId);
    return this.ok(res, plugins, "Plugins listed successfully");
  }

  @AsyncController()
  async toggle(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { pluginPath, enable } = req.body;

    await this.pluginService.togglePlugin(id, userId, pluginPath, enable);
    return this.ok(res, undefined, `Plugin status changed to ${enable ? "enabled" : "disabled"}`);
  }

  @AsyncController()
  async delete(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { pluginPath } = req.body;

    await this.pluginService.deletePlugin(id, userId, pluginPath);
    return this.ok(res, undefined, "Plugin deleted successfully");
  }

  @AsyncController()
  async upload(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const fileName = req.query.name as string;

    if (!fileName) {
      throw new BadRequestException("Name query parameter is required for the plugin upload");
    }

    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength, 10) > 200 * 1024 * 1024) {
      throw new BadRequestException("Plugin jar exceeds maximum upload limit of 200MB");
    }

    await this.pluginService.uploadPlugin(id, userId, fileName, req);
    return this.ok(res, undefined, "Plugin uploaded successfully");
  }
}
