/*
  Warnings:

  - A unique constraint covering the columns `[sourceKey]` on the table `mob_drops` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "mob_drops" ADD COLUMN "sourceKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mob_drops_sourceKey_key" ON "mob_drops"("sourceKey");
