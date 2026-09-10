-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aegisName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "hp" INTEGER NOT NULL DEFAULT 1,
    "sp" INTEGER NOT NULL DEFAULT 1,
    "baseExp" INTEGER NOT NULL DEFAULT 0,
    "jobExp" INTEGER NOT NULL DEFAULT 0,
    "attack" INTEGER NOT NULL DEFAULT 0,
    "attack2" INTEGER NOT NULL DEFAULT 0,
    "defense" INTEGER NOT NULL DEFAULT 0,
    "resistance" INTEGER NOT NULL DEFAULT 0,
    "magicDefense" INTEGER NOT NULL DEFAULT 0,
    "str" INTEGER NOT NULL DEFAULT 1,
    "agi" INTEGER NOT NULL DEFAULT 1,
    "vit" INTEGER NOT NULL DEFAULT 1,
    "int" INTEGER NOT NULL DEFAULT 1,
    "dex" INTEGER NOT NULL DEFAULT 1,
    "luk" INTEGER NOT NULL DEFAULT 1,
    "attackRange" INTEGER NOT NULL DEFAULT 1,
    "skillRange" INTEGER NOT NULL DEFAULT 10,
    "chaseRange" INTEGER NOT NULL DEFAULT 12,
    "size" TEXT NOT NULL DEFAULT 'Small',
    "race" TEXT NOT NULL DEFAULT 'Formless',
    "element" TEXT NOT NULL DEFAULT 'Neutral',
    "elementLevel" INTEGER NOT NULL DEFAULT 1,
    "walkSpeed" INTEGER NOT NULL DEFAULT 200,
    "attackDelay" INTEGER NOT NULL DEFAULT 2000,
    "attackMotion" INTEGER NOT NULL DEFAULT 720,
    "damageMotion" INTEGER NOT NULL DEFAULT 480,
    "ai" TEXT NOT NULL DEFAULT '01',
    "source" TEXT NOT NULL DEFAULT 'rathena',
    "sourceHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_mobs" ("aegisName", "agi", "ai", "attack", "attack2", "attackDelay", "attackMotion", "attackRange", "baseExp", "chaseRange", "createdAt", "damageMotion", "defense", "dex", "element", "elementLevel", "hp", "id", "int", "jobExp", "level", "luk", "magicDefense", "name", "race", "size", "skillRange", "source", "sourceHash", "sp", "str", "updatedAt", "vit", "walkSpeed") SELECT "aegisName", "agi", "ai", "attack", "attack2", "attackDelay", "attackMotion", "attackRange", "baseExp", "chaseRange", "createdAt", "damageMotion", "defense", "dex", "element", "elementLevel", "hp", "id", "int", "jobExp", "level", "luk", "magicDefense", "name", "race", "size", "skillRange", "source", "sourceHash", "sp", "str", "updatedAt", "vit", "walkSpeed" FROM "mobs";
DROP TABLE "mobs";
ALTER TABLE "new_mobs" RENAME TO "mobs";
CREATE UNIQUE INDEX "mobs_aegisName_key" ON "mobs"("aegisName");
CREATE INDEX "mobs_level_idx" ON "mobs"("level");
CREATE INDEX "mobs_race_idx" ON "mobs"("race");
CREATE INDEX "mobs_element_idx" ON "mobs"("element");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
