import { injectable, inject } from "tsyringe";
import { PrismaClient } from "@prisma/client";

@injectable()
export class UserRepository {
  constructor(@inject("PrismaClient") private readonly db: PrismaClient) { }

  async findById(id: string) {
    return await this.db.user.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
      },
    });
  }

  async findByEmail(email: string) {
    return await this.db.user.findFirst({ where: { email } });
  }

  async count() {
    return await this.db.user.count();
  }

  async create(data: { name?: string | null; email: string; password?: string | null; role?: "USER" | "ADMIN" }) {
    return await this.db.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
      },
    });
  }

  async findByIdWithPassword(id: string) {
    return await this.db.user.findFirst({
      where: { id },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return await this.db.user.update({
      where: { id: userId },
      data: { password: passwordHash },
      select: { id: true, email: true },
    });
  }
}
