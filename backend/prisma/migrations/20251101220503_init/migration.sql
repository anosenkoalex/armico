/*
  Warnings:

  - The values [ORG_ADMIN,MANAGER,WORKER,VIEWER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `orgId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `Org` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Workplace` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `Workplace` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Workplace` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Workplace` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Org` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,code]` on the table `Workplace` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Org` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Workplace` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ASSIGNMENT_CREATED', 'ASSIGNMENT_UPDATED');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_orgId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_orgId_fkey";

-- DropIndex
DROP INDEX "Assignment_orgId_userId_startsAt_endsAt_idx";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "orgId",
ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "endsAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Org" DROP COLUMN "timezone",
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "position" TEXT,
ALTER COLUMN "orgId" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'USER';

-- AlterTable
ALTER TABLE "Workplace" DROP COLUMN "address",
DROP COLUMN "capacity",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Org_slug_key" ON "Org"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Workplace_orgId_code_key" ON "Workplace"("orgId", "code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
