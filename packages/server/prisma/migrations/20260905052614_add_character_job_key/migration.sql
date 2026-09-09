/*
  Warnings:

  - Added the required column `jobKey` to the `characters` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classKey" TEXT NOT NULL,
    "jobKey" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "jobLevel" INTEGER NOT NULL DEFAULT 1,
    "baseExp" BIGINT NOT NULL DEFAULT 0,
    "jobExp" BIGINT NOT NULL DEFAULT 0,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "availableSkillPoints" INTEGER NOT NULL DEFAULT 0,
    "str" INTEGER NOT NULL DEFAULT 1,
    "agi" INTEGER NOT NULL DEFAULT 1,
    "vit" INTEGER NOT NULL DEFAULT 1,
    "int" INTEGER NOT NULL DEFAULT 1,
    "dex" INTEGER NOT NULL DEFAULT 1,
    "luk" INTEGER NOT NULL DEFAULT 1,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "maxHp" INTEGER NOT NULL DEFAULT 100,
    "mp" INTEGER NOT NULL DEFAULT 50,
    "maxMp" INTEGER NOT NULL DEFAULT 50,
    "mapId" TEXT NOT NULL DEFAULT 'plains_of_ash',
    "posX" REAL NOT NULL DEFAULT 200,
    "posY" REAL NOT NULL DEFAULT 200,
    "posZ" REAL NOT NULL DEFAULT 0,
    "gold" BIGINT NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "characters_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_characters" (
    "accountId",
    "agi",
    "availablePoints",
    "availableSkillPoints",
    "baseExp",
    "classKey",
    "jobKey",
    "createdAt",
    "dex",
    "faction",
    "gold",
    "hp",
    "id",
    "int",
    "jobExp",
    "jobLevel",
    "level",
    "luk",
    "mapId",
    "maxHp",
    "maxMp",
    "mp",
    "name",
    "posX",
    "posY",
    "posZ",
    "str",
    "updatedAt",
    "vit"
)
SELECT
    "accountId",
    "agi",
    "availablePoints",
    "availableSkillPoints",
    "baseExp",
    "classKey",
    CASE "classKey"
        WHEN 'knight' THEN 'SWORDMAN'
        WHEN 'assassin' THEN 'THIEF'
        WHEN 'archer' THEN 'ARCHER'
        WHEN 'mage' THEN 'MAGE'
        WHEN 'cleric' THEN 'ACOLYTE'
        ELSE 'SWORDMAN'
    END,
    "createdAt",
    "dex",
    "faction",
    "gold",
    "hp",
    "id",
    "int",
    "jobExp",
    "jobLevel",
    "level",
    "luk",
    "mapId",
    "maxHp",
    "maxMp",
    "mp",
    "name",
    "posX",
    "posY",
    "posZ",
    "str",
    "updatedAt",
    "vit"
FROM "characters";
DROP TABLE "characters";
ALTER TABLE "new_characters" RENAME TO "characters";
CREATE UNIQUE INDEX "characters_name_key" ON "characters"("name");
CREATE INDEX "characters_accountId_idx" ON "characters"("accountId");
CREATE INDEX "characters_mapId_idx" ON "characters"("mapId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
