-- CreateTable
CREATE TABLE "job_exp_groups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceKey" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'rathena',
    "sourceHash" TEXT,
    "maxJobLevel" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "job_exp_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "exp" BIGINT NOT NULL,
    CONSTRAINT "job_exp_entries_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "job_exp_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_game_classes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aegisName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" INTEGER,
    "baseJobId" INTEGER,
    "jobLevel" INTEGER,
    "heleonaireClass" TEXT,
    "source" TEXT NOT NULL DEFAULT 'rathena',
    "sourceHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jobExpGroupId" INTEGER,
    CONSTRAINT "game_classes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "game_classes" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "game_classes_jobExpGroupId_fkey" FOREIGN KEY ("jobExpGroupId") REFERENCES "job_exp_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_game_classes" ("aegisName", "baseJobId", "createdAt", "heleonaireClass", "id", "jobLevel", "name", "parentId", "source", "sourceHash", "updatedAt") SELECT "aegisName", "baseJobId", "createdAt", "heleonaireClass", "id", "jobLevel", "name", "parentId", "source", "sourceHash", "updatedAt" FROM "game_classes";
DROP TABLE "game_classes";
ALTER TABLE "new_game_classes" RENAME TO "game_classes";
CREATE UNIQUE INDEX "game_classes_aegisName_key" ON "game_classes"("aegisName");
CREATE INDEX "game_classes_parentId_idx" ON "game_classes"("parentId");
CREATE INDEX "game_classes_heleonaireClass_idx" ON "game_classes"("heleonaireClass");
CREATE INDEX "game_classes_jobExpGroupId_idx" ON "game_classes"("jobExpGroupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "job_exp_groups_sourceKey_key" ON "job_exp_groups"("sourceKey");

-- CreateIndex
CREATE INDEX "job_exp_entries_groupId_idx" ON "job_exp_entries"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "job_exp_entries_groupId_level_key" ON "job_exp_entries"("groupId", "level");
