import { injectable, inject } from "tsyringe";
import { PrismaClient, Server, ServerStatus, ServerSoftware } from "@prisma/client";

@injectable()
export class ServerRepository {
  constructor(@inject("PrismaClient") private readonly db: PrismaClient) { }

  async create(data: {
    name: string;
    description?: string;
    software: ServerSoftware;
    version: string;
    buildNumber?: string;
    port: number;
    ramLimit: number;
    cpuLimit: number;
    javaVersion: string;
    worldSeed?: string;
    worldType?: string;
    generateStructures?: boolean;
    host?: string;
    maxPlayers: number;
    userId: string;
  }): Promise<Server> {
    return await this.db.server.create({
      data: {
        name: data.name,
        description: data.description,
        software: data.software,
        version: data.version,
        buildNumber: data.buildNumber,
        port: data.port,
        ramLimit: data.ramLimit,
        cpuLimit: data.cpuLimit,
        javaVersion: data.javaVersion,
        worldSeed: data.worldSeed,
        worldType: data.worldType ?? "DEFAULT",
        generateStructures: data.generateStructures ?? true,
        host: data.host ?? "localhost",
        maxPlayers: data.maxPlayers,
        userId: data.userId,
      },
    });
  }

  async findAllByUserId(userId: string): Promise<Server[]> {
    return await this.db.server.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Server | null> {
    return await this.db.server.findFirst({
      where: { id, userId },
    });
  }

  async findById(id: string): Promise<Server | null> {
    return await this.db.server.findUnique({
      where: { id },
    });
  }

  async findByPort(port: number): Promise<Server | null> {
    return await this.db.server.findFirst({
      where: { port },
    });
  }

  async update(id: string, userId: string, data: Partial<Omit<Server, "id" | "userId" | "createdAt" | "updatedAt">>): Promise<Server> {
    return await this.db.server.update({
      where: { id, userId },
      data,
    });
  }

  async delete(id: string, userId: string): Promise<Server> {
    return await this.db.server.delete({
      where: { id, userId },
    });
  }

  async updateStatus(id: string, userId: string, status: ServerStatus): Promise<Server> {
    return await this.db.server.update({
      where: { id, userId },
      data: { status },
    });
  }

  async updateMetrics(id: string, userId: string, metrics: { cpuUsage: number; ramUsage: number; uptime: number }): Promise<Server> {
    return await this.db.server.update({
      where: { id, userId },
      data: metrics,
    });
  }
}
