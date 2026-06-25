-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServerSoftware" ADD VALUE 'Modpack';
ALTER TYPE "ServerSoftware" ADD VALUE 'Fabric';
ALTER TYPE "ServerSoftware" ADD VALUE 'Bedrock';
ALTER TYPE "ServerSoftware" ADD VALUE 'NeoForge';
ALTER TYPE "ServerSoftware" ADD VALUE 'Quilt';

-- AlterTable
ALTER TABLE "tbl_servers" ADD COLUMN     "build_number" TEXT,
ADD COLUMN     "generate_structures" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "world_seed" TEXT,
ADD COLUMN     "world_type" TEXT NOT NULL DEFAULT 'DEFAULT';
