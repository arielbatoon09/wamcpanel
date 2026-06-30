import { injectable, inject } from "tsyringe";
import type { Request, Response } from "express";
import { BaseController } from "@/controllers/base-controller";
import { AsyncController } from "@/lib/decorators";
import { SystemUpdateService } from "@/services/system/system-update-service";

@injectable()
export class SystemController extends BaseController {
  constructor(
    @inject(SystemUpdateService) private readonly systemUpdateService: SystemUpdateService
  ) {
    super();
  }

  @AsyncController()
  async check(req: Request, res: Response) {
    const result = await this.systemUpdateService.checkUpdate();
    return this.ok(res, result, "Update status checked successfully");
  }

  @AsyncController()
  async update(req: Request, res: Response) {
    const result = await this.systemUpdateService.triggerUpdate();
    return this.ok(res, result, "Update process triggered successfully");
  }
}
