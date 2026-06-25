-- CreateEnum
CREATE TYPE "ServerStatus" AS ENUM ('ONLINE', 'OFFLINE', 'STARTING', 'STOPPING');

-- CreateEnum
CREATE TYPE "ServerSoftware" AS ENUM ('Vanilla', 'Paper', 'Forge', 'Velocity');

-- CreateTable
CREATE TABLE "tbl_servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ServerStatus" NOT NULL DEFAULT 'OFFLINE',
    "host" TEXT NOT NULL DEFAULT 'localhost',
    "port" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "software" "ServerSoftware" NOT NULL,
    "maxPlayers" INTEGER NOT NULL DEFAULT 20,
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "cpuLimit" INTEGER NOT NULL DEFAULT 200,
    "ramLimit" INTEGER NOT NULL DEFAULT 4096,
    "javaVersion" TEXT NOT NULL DEFAULT '21',
    "cpuUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ramUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uptime" INTEGER NOT NULL DEFAULT 0,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_servers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_servers" ADD CONSTRAINT "tbl_servers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
