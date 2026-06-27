import { injectable, inject } from "tsyringe";
import type { Request, Response } from "express";
import { BaseController } from "@/controllers/base-controller";
import { AsyncController } from "@/lib/decorators";
import { BackupService } from "@/services/servers/backup-service";
import { BadRequestException } from "@/exceptions";

@injectable()
export class BackupController extends BaseController {
  constructor(@inject(BackupService) private readonly backupService: BackupService) {
    super();
  }

  @AsyncController()
  async list(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };

    const backups = await this.backupService.list(id, userId);
    return this.ok(res, backups, "Backups listed successfully");
  }

  @AsyncController()
  async create(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { name } = req.body;

    await this.backupService.create(id, userId, name || "");
    return this.ok(res, undefined, "Backup created successfully");
  }

  @AsyncController()
  async delete(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { filename } = req.params as { filename: string };

    await this.backupService.delete(id, userId, filename);
    return this.ok(res, undefined, "Backup deleted successfully");
  }

  @AsyncController()
  async restore(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { filename } = req.params as { filename: string };

    await this.backupService.restore(id, userId, filename);
    return this.ok(res, undefined, "Backup restored successfully");
  }

  @AsyncController()
  async download(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { filename } = req.params as { filename: string };

    const filepath = await this.backupService.getDownloadPath(id, userId, filename);
    return res.download(filepath, filename);
  }

  @AsyncController()
  async upload(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const fileName = req.query.name as string;

    if (!fileName) {
      throw new BadRequestException("Name query parameter is required for the uploaded backup");
    }

    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength, 10) > 1024 * 1024 * 1024) {
      // 1GB limit for backups
      throw new BadRequestException("Backup exceeds maximum upload limit of 1GB");
    }

    await this.backupService.upload(id, userId, fileName, req);
    return this.ok(res, undefined, "Backup uploaded successfully");
  }
}
