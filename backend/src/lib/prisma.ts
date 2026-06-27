import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
// @ts-expect-error: @prisma/client default export is used for ESM CJS interop at runtime but lacks default export type definition
import pkg from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new ((pkg as any).PrismaClient || pkg.PrismaClient)({ adapter });

const ServerStatus = (pkg as any).ServerStatus;
const ServerSoftware = (pkg as any).ServerSoftware;
const TokenType = (pkg as any).TokenType;
const Role = (pkg as any).Role;

export { prisma, ServerStatus, ServerSoftware, TokenType, Role };