/*
  Warnings:

  - You are about to drop the `statpoint_table` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "statpoint_table";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "stat_point_table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "traitPoints" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'rathena',
    "sourceHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "stat_point_table_level_key" ON "stat_point_table"("level");
