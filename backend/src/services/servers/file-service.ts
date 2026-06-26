import { injectable, inject } from "tsyringe";
import { ServerRepository } from "@/repositories/server-repository";
import { NotFoundException, BadRequestException, HttpException } from "@/exceptions";
import { getServerDirectory } from "@/utils/server-path";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import AdmZip from "adm-zip";

@injectable()
export class FileService {
  constructor(
    @inject(ServerRepository) private readonly serverRepository: ServerRepository
  ) {}

  private async verifyServerAccess(serverId: string, userId: string) {
    const existing = await this.serverRepository.findByIdAndUserId(serverId, userId);
    if (!existing) {
      throw new NotFoundException("Server not found");
    }
    return existing;
  }

  private resolveSafePath(serverId: string, relativePath: string): string {
    const root = getServerDirectory(serverId);
    const safePath = path.normalize(path.join(root, relativePath));

    if (!safePath.startsWith(root)) {
      throw new BadRequestException("Invalid path: directory traversal detected");
    }

    return safePath;
  }

  public async list(serverId: string, userId: string, relativePath: string) {
    await this.verifyServerAccess(serverId, userId);
    const targetPath = this.resolveSafePath(serverId, relativePath);

    try {
      const stats = await fs.promises.stat(targetPath);
      if (!stats.isDirectory()) {
        throw new BadRequestException("Target path is not a directory");
      }

      const dirents = await fs.promises.readdir(targetPath, { withFileTypes: true });
      const filesList = [];

      for (const dirent of dirents) {
        const fullPath = path.join(targetPath, dirent.name);
        try {
          const fileStats = await fs.promises.stat(fullPath);
          filesList.push({
            name: dirent.name,
            isDir: dirent.isDirectory(),
            size: dirent.isDirectory() ? null : fileStats.size,
            updatedAt: fileStats.mtime,
          });
        } catch {
          // Skip file if stat fails (e.g. broken symlink)
        }
      }

      return filesList;
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      if (err.code === "ENOENT") {
        throw new NotFoundException("Directory not found");
      }
      throw new BadRequestException(`Failed to list directory: ${err.message}`);
    }
  }

  public async view(serverId: string, userId: string, relativePath: string): Promise<string> {
    await this.verifyServerAccess(serverId, userId);
    const targetPath = this.resolveSafePath(serverId, relativePath);

    try {
      const stats = await fs.promises.stat(targetPath);
      if (stats.isDirectory()) {
        throw new BadRequestException("Cannot view a directory content");
      }
      return await fs.promises.readFile(targetPath, "utf8");
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      if (err.code === "ENOENT") {
        throw new NotFoundException("File not found");
      }
      throw new BadRequestException(`Failed to read file: ${err.message}`);
    }
  }

  public async write(serverId: string, userId: string, relativePath: string, content: string): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const targetPath = this.resolveSafePath(serverId, relativePath);

    try {
      const dirName = path.dirname(targetPath);
      await fs.promises.mkdir(dirName, { recursive: true });
      await fs.promises.writeFile(targetPath, content, "utf8");
    } catch (err: any) {
      throw new BadRequestException(`Failed to write file: ${err.message}`);
    }
  }

  public async create(serverId: string, userId: string, relativePath: string, name: string, isDir: boolean): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const parentPath = this.resolveSafePath(serverId, relativePath);
    const targetPath = this.resolveSafePath(serverId, path.join(relativePath, name));

    try {
      const stats = await fs.promises.stat(parentPath);
      if (!stats.isDirectory()) {
        throw new BadRequestException("Parent path is not a directory");
      }

      // Check if target already exists
      try {
        await fs.promises.access(targetPath);
        throw new BadRequestException("File or folder already exists");
      } catch (accessErr: any) {
        if (accessErr.code !== "ENOENT") throw accessErr;
      }

      if (isDir) {
        await fs.promises.mkdir(targetPath, { recursive: true });
      } else {
        await fs.promises.writeFile(targetPath, "", "utf8");
      }
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new BadRequestException(`Failed to create item: ${err.message}`);
    }
  }

  public async delete(serverId: string, userId: string, relativePath: string): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const targetPath = this.resolveSafePath(serverId, relativePath);

    if (targetPath === getServerDirectory(serverId)) {
      throw new BadRequestException("Cannot delete server root directory");
    }

    try {
      await fs.promises.rm(targetPath, { recursive: true, force: true });
    } catch (err: any) {
      throw new BadRequestException(`Failed to delete item: ${err.message}`);
    }
  }

  public async upload(serverId: string, userId: string, relativePath: string, fileName: string, stream: Readable): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const parentPath = this.resolveSafePath(serverId, relativePath);
    const targetPath = this.resolveSafePath(serverId, path.join(relativePath, fileName));

    try {
      const stats = await fs.promises.stat(parentPath);
      if (!stats.isDirectory()) {
        throw new BadRequestException("Upload destination must be a directory");
      }

      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(targetPath);
        stream.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", (err) => {
          writeStream.destroy();
          reject(err);
        });
      });
    } catch (err: any) {
      throw new BadRequestException(`Upload failed: ${err.message}`);
    }
  }

  public async extract(serverId: string, userId: string, relativePath: string, targetRelativePath: string): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const zipPath = this.resolveSafePath(serverId, relativePath);
    const targetPath = this.resolveSafePath(serverId, targetRelativePath);

    try {
      const stats = await fs.promises.stat(zipPath);
      if (stats.isDirectory()) {
        throw new BadRequestException("Target path is a directory, not a zip archive");
      }

      await fs.promises.mkdir(targetPath, { recursive: true });

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(targetPath, true);
    } catch (err: any) {
      throw new BadRequestException(`Failed to extract archive: ${err.message}`);
    }
  }

  public async compress(serverId: string, userId: string, relativePath: string, files: string[], archiveName: string): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const parentPath = this.resolveSafePath(serverId, relativePath);
    const targetZipPath = this.resolveSafePath(serverId, path.join(relativePath, archiveName));

    try {
      const zip = new AdmZip();

      for (const fileName of files) {
        const itemPath = this.resolveSafePath(serverId, path.join(relativePath, fileName));
        const stats = await fs.promises.stat(itemPath);

        if (stats.isDirectory()) {
          zip.addLocalFolder(itemPath, fileName);
        } else {
          zip.addLocalFile(itemPath);
        }
      }

      zip.writeZip(targetZipPath);
    } catch (err: any) {
      throw new BadRequestException(`Failed to compress files: ${err.message}`);
    }
  }

  public async deleteBulk(serverId: string, userId: string, relativePaths: string[]): Promise<void> {
    await this.verifyServerAccess(serverId, userId);

    for (const relativePath of relativePaths) {
      const targetPath = this.resolveSafePath(serverId, relativePath);
      if (targetPath === getServerDirectory(serverId)) {
        throw new BadRequestException("Cannot delete server root directory");
      }
      try {
        await fs.promises.rm(targetPath, { recursive: true, force: true });
      } catch (err: any) {
        throw new BadRequestException(`Failed to delete item ${relativePath}: ${err.message}`);
      }
    }
  }

  public async rename(serverId: string, userId: string, relativePath: string, newName: string): Promise<void> {
    await this.verifyServerAccess(serverId, userId);
    const targetPath = this.resolveSafePath(serverId, relativePath);

    if (targetPath === getServerDirectory(serverId)) {
      throw new BadRequestException("Cannot rename server root directory");
    }

    const parentRelativePath = path.dirname(relativePath);
    const newRelativePath = parentRelativePath === "." ? newName : path.join(parentRelativePath, newName);
    const newPath = this.resolveSafePath(serverId, newRelativePath);

    try {
      // Check if target already exists
      try {
        await fs.promises.access(newPath);
        throw new BadRequestException("File or folder already exists with that name");
      } catch (accessErr: any) {
        if (accessErr.code !== "ENOENT") throw accessErr;
      }

      await fs.promises.rename(targetPath, newPath);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new BadRequestException(`Failed to rename item: ${err.message}`);
    }
  }
}
