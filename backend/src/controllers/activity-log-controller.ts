import { injectable, inject } from "tsyringe";
import type { Request, Response } from "express";
import { BaseController } from "@/controllers/base-controller";
import { AsyncController } from "@/lib/decorators";
import { ActivityLogService } from "@/services/servers/activity-log-service";

@injectable()
export class ActivityLogController extends BaseController {
  constructor(@inject(ActivityLogService) private readonly activityLogService: ActivityLogService) {
    super();
  }

  @AsyncController()
  async list(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };

    const logs = await this.activityLogService.getLogs(id, userId);
    return this.ok(res, logs, "Activity logs listed successfully");
  }
}
