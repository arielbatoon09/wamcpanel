import { injectable, inject } from "tsyringe";
import type { Request, Response } from "express";
import { BaseController } from "@/controllers/base-controller";
import { AsyncController } from "@/lib/decorators";
import { FileService } from "@/services/servers/file-service";
import { BadRequestException } from "@/exceptions";

@injectable()
export class FileController extends BaseController {
  constructor(
    @inject(FileService) private readonly fileService: FileService
  ) {
    super();
  }

  @AsyncController()
  async list(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const relativePath = (req.query.path as string) || "";

    const files = await this.fileService.list(id, userId, relativePath);
    return this.ok(res, files, "Files listed successfully");
  }

  @AsyncController()
  async view(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const relativePath = req.query.path as string;

    if (!relativePath) {
      throw new BadRequestException("Path query parameter is required");
    }

    const content = await this.fileService.view(id, userId, relativePath);
    return this.ok(res, { content }, "File read successfully");
  }

  @AsyncController()
  async write(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { path: relativePath, content } = req.body;

    await this.fileService.write(id, userId, relativePath, content);
    return this.ok(res, undefined, "File saved successfully");
  }

  @AsyncController()
  async create(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { path: relativePath, name, isDir } = req.body;

    await this.fileService.create(id, userId, relativePath, name, isDir);
    return this.ok(res, undefined, `${isDir ? "Folder" : "File"} created successfully`);
  }

  @AsyncController()
  async delete(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const relativePath = req.query.path as string;

    if (!relativePath) {
      throw new BadRequestException("Path query parameter is required");
    }

    await this.fileService.delete(id, userId, relativePath);
    return this.ok(res, undefined, "Item deleted successfully");
  }

  @AsyncController()
  async upload(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const relativePath = (req.query.path as string) || "";
    const fileName = req.query.name as string;

    if (!fileName) {
      throw new BadRequestException("Name query parameter is required for the uploaded file");
    }

    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength, 10) > 500 * 1024 * 1024) {
      throw new BadRequestException("File exceeds maximum upload limit of 500MB");
    }

    await this.fileService.upload(id, userId, relativePath, fileName, req);
    return this.ok(res, undefined, "File uploaded successfully");
  }

  @AsyncController()
  async extract(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { path: relativePath, targetPath } = req.body;

    await this.fileService.extract(id, userId, relativePath, targetPath || "");
    return this.ok(res, undefined, "Archive extracted successfully");
  }

  @AsyncController()
  async compress(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { path: relativePath, files, archiveName } = req.body;

    await this.fileService.compress(id, userId, relativePath || "", files, archiveName);
    return this.ok(res, undefined, "Files compressed successfully");
  }

  @AsyncController()
  async deleteBulk(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { paths } = req.body;

    await this.fileService.deleteBulk(id, userId, paths);
    return this.ok(res, undefined, "Selected items deleted successfully");
  }

  @AsyncController()
  async rename(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { path: relativePath, newName } = req.body;

    await this.fileService.rename(id, userId, relativePath, newName);
    return this.ok(res, undefined, "Item renamed successfully");
  }
}
