/*
  Warnings:

  - You are about to drop the `skill_prerequisites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "skill_prerequisites";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "class_skill_prerequisites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classSkillId" TEXT NOT NULL,
    "requiredSkillId" INTEGER NOT NULL,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "class_skill_prerequisites_classSkillId_fkey" FOREIGN KEY ("classSkillId") REFERENCES "class_skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_skill_prerequisites_requiredSkillId_fkey" FOREIGN KEY ("requiredSkillId") REFERENCES "skills" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "class_skill_prerequisites_requiredSkillId_idx" ON "class_skill_prerequisites"("requiredSkillId");

-- CreateIndex
CREATE UNIQUE INDEX "class_skill_prerequisites_classSkillId_requiredSkillId_key" ON "class_skill_prerequisites"("classSkillId", "requiredSkillId");
