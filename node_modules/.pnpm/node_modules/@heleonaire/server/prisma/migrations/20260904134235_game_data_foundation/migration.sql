/*
  Warnings:

  - You are about to drop the column `class` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `isEquipped` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `itemName` on the `inventory` table. All the data in the column will be lost.
  - You are about to alter the column `refineable` on the `items` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `weight` on the `items` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - The primary key for the `mob_drops` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `stealProtected` on the `mob_drops` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - Made the column `id` on table `accounts` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `classKey` to the `characters` table without a default value. This is not possible if the table is not empty.
  - Made the column `id` on table `characters` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Made the column `id` on table `inventory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `aegisName` on table `items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `items` required. This step will fail if there are existing NULL values in that column.
  - The required column `id` was added to the `mob_drops` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `rate` on table `mob_drops` required. This step will fail if there are existing NULL values in that column.
  - Made the column `aegisName` on table `mobs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `mobs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `mobs` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "character_equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "slot" TEXT NOT NULL,
    "inventoryId" TEXT,
    "refineLevel" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "character_equipment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "character_equipment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skills" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aegisName" TEXT NOT NULL,
    "description" TEXT,
    "maxLevel" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT,
    "targetType" TEXT,
    "hit" TEXT,
    "damageFlags" TEXT,
    "flags" TEXT,
    "range" INTEGER NOT NULL DEFAULT 0,
    "castCancel" BOOLEAN NOT NULL DEFAULT true,
    "castDefenseReduction" INTEGER NOT NULL DEFAULT 0,
    "castTimeFlags" TEXT,
    "castDelayFlags" TEXT,
    "copyFlags" TEXT,
    "removeRequirement" TEXT,
    "noNearNpc" BOOLEAN NOT NULL DEFAULT false,
    "additionalRange" INTEGER,
    "noNearNpcType" TEXT,
    "source" TEXT NOT NULL DEFAULT 'rathena',
    "sourceHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "skill_levels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "range" INTEGER,
    "hitCount" INTEGER,
    "element" TEXT,
    "splashArea" INTEGER,
    "activeInstance" INTEGER,
    "knockback" INTEGER,
    "giveAp" INTEGER,
    "castTime" INTEGER,
    "afterCastActDelay" INTEGER,
    "afterCastWalkDelay" INTEGER,
    "duration1" INTEGER,
    "duration2" INTEGER,
    "cooldown" INTEGER,
    "fixedCastTime" INTEGER,
    CONSTRAINT "skill_levels_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skill_requirements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" INTEGER NOT NULL,
    "level" INTEGER,
    "hpCost" INTEGER NOT NULL DEFAULT 0,
    "spCost" INTEGER NOT NULL DEFAULT 0,
    "apCost" INTEGER NOT NULL DEFAULT 0,
    "hpRateCost" INTEGER NOT NULL DEFAULT 0,
    "spRateCost" INTEGER NOT NULL DEFAULT 0,
    "apRateCost" INTEGER NOT NULL DEFAULT 0,
    "maxHpTrigger" INTEGER NOT NULL DEFAULT 0,
    "zenyCost" INTEGER NOT NULL DEFAULT 0,
    "weapon" TEXT,
    "ammo" TEXT,
    "ammoAmount" INTEGER NOT NULL DEFAULT 0,
    "state" TEXT,
    "status" TEXT,
    "spiritSphereCost" INTEGER NOT NULL DEFAULT 0,
    "equipment" TEXT,
    CONSTRAINT "skill_requirements_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skill_requirement_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "level" INTEGER,
    CONSTRAINT "skill_requirement_items_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "skill_requirements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "skill_requirement_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skill_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,
    "alternateId" TEXT,
    "layout" INTEGER NOT NULL DEFAULT 0,
    "range" INTEGER NOT NULL DEFAULT 0,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "target" TEXT,
    "flags" TEXT,
    "status" TEXT,
    CONSTRAINT "skill_units_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skill_unit_levels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillUnitId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "layout" INTEGER,
    "range" INTEGER,
    CONSTRAINT "skill_unit_levels_skillUnitId_fkey" FOREIGN KEY ("skillUnitId") REFERENCES "skill_units" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "game_classes" (
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
    CONSTRAINT "game_classes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "game_classes" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "class_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "maxLevel" INTEGER NOT NULL DEFAULT 1,
    "requiredJobLevel" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "class_skills_classId_fkey" FOREIGN KEY ("classId") REFERENCES "game_classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skill_prerequisites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" INTEGER NOT NULL,
    "requiredSkillId" INTEGER NOT NULL,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "skill_prerequisites_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "skill_prerequisites_requiredSkillId_fkey" FOREIGN KEY ("requiredSkillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "character_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "skillId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "learned" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "character_skills_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "character_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_stat_growth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "str" INTEGER NOT NULL DEFAULT 0,
    "agi" INTEGER NOT NULL DEFAULT 0,
    "vit" INTEGER NOT NULL DEFAULT 0,
    "int" INTEGER NOT NULL DEFAULT 0,
    "dex" INTEGER NOT NULL DEFAULT 0,
    "luk" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "class_stat_growth_classId_fkey" FOREIGN KEY ("classId") REFERENCES "game_classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_base_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "class_base_points_classId_fkey" FOREIGN KEY ("classId") REFERENCES "game_classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_aspd" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" INTEGER NOT NULL,
    "weaponType" TEXT NOT NULL,
    "aspd" INTEGER NOT NULL,
    CONSTRAINT "class_aspd_classId_fkey" FOREIGN KEY ("classId") REFERENCES "game_classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "status_effects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "aegisName" TEXT,
    "description" TEXT,
    "type" TEXT,
    "duration" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'rathena',
    "sourceHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "attribute_modifiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attackerElement" TEXT NOT NULL,
    "defenderElement" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "modifier" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'rathena'
);

-- CreateTable
CREATE TABLE "size_modifiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weaponType" TEXT NOT NULL,
    "targetSize" TEXT NOT NULL,
    "modifier" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'rathena'
);

-- CreateTable
CREATE TABLE "level_penalties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "levelDifference" INTEGER NOT NULL,
    "penaltyType" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'rathena'
);

-- CreateTable
CREATE TABLE "exp_tables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "exp" BIGINT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'rathena'
);

-- CreateTable
CREATE TABLE "statpoint_table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'rathena'
);

-- CreateTable
CREATE TABLE "item_combos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "script" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "item_combo_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comboId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    CONSTRAINT "item_combo_entries_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "item_combos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_combo_entries_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "data_imports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataset" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceVersion" TEXT,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsDeleted" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_accounts" ("createdAt", "email", "id", "password", "updatedAt", "username") SELECT "createdAt", "email", "id", "password", "updatedAt", "username" FROM "accounts";
DROP TABLE "accounts";
ALTER TABLE "new_accounts" RENAME TO "accounts";
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");
CREATE TABLE "new_characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classKey" TEXT NOT NULL,
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
INSERT INTO "new_characters" ("accountId", "agi", "availablePoints", "baseExp", "createdAt", "dex", "faction", "gold", "hp", "id", "int", "jobExp", "level", "luk", "mapId", "maxHp", "maxMp", "mp", "name", "posX", "posY", "str", "updatedAt", "vit") SELECT "accountId", "agi", "availablePoints", "baseExp", "createdAt", "dex", "faction", "gold", "hp", "id", "int", "jobExp", "level", "luk", "mapId", "maxHp", "maxMp", "mp", "name", "posX", "posY", "str", "updatedAt", "vit" FROM "characters";
DROP TABLE "characters";
ALTER TABLE "new_characters" RENAME TO "characters";
CREATE UNIQUE INDEX "characters_name_key" ON "characters"("name");
CREATE INDEX "characters_accountId_idx" ON "characters"("accountId");
CREATE INDEX "characters_mapId_idx" ON "characters"("mapId");
CREATE TABLE "new_inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "slot" INTEGER NOT NULL DEFAULT -1,
    "instanceId" TEXT,
    "refineLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inventory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_inventory" ("characterId", "id", "itemId", "quantity", "slot") SELECT "characterId", "id", "itemId", "quantity", "slot" FROM "inventory";
DROP TABLE "inventory";
ALTER TABLE "new_inventory" RENAME TO "inventory";
CREATE INDEX "inventory_characterId_idx" ON "inventory"("characterId");
CREATE INDEX "inventory_characterId_slot_idx" ON "inventory"("characterId", "slot");
CREATE INDEX "inventory_itemId_idx" ON "inventory"("itemId");
CREATE TABLE "new_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aegisName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subType" TEXT,
    "buy" INTEGER NOT NULL DEFAULT 0,
    "sell" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "attack" INTEGER,
    "magicAttack" INTEGER,
    "defense" INTEGER,
    "range" INTEGER,
    "slots" INTEGER,
    "weaponLevel" INTEGER,
    "armorLevel" INTEGER,
    "equipLevelMin" INTEGER,
    "equipLevelMax" INTEGER,
    "refineable" BOOLEAN NOT NULL DEFAULT false,
    "gradable" BOOLEAN NOT NULL DEFAULT false,
    "jobs" TEXT,
    "classes" TEXT,
    "gender" TEXT,
    "locations" TEXT,
    "view" INTEGER,
    "aliasName" TEXT,
    "buyingStore" BOOLEAN NOT NULL DEFAULT false,
    "deadBranch" BOOLEAN NOT NULL DEFAULT false,
    "container" BOOLEAN NOT NULL DEFAULT false,
    "uniqueId" BOOLEAN NOT NULL DEFAULT false,
    "sitting" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'rathena',
    "sourceHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_items" ("aegisName", "armorLevel", "attack", "buy", "createdAt", "defense", "equipLevelMin", "id", "magicAttack", "name", "range", "refineable", "sell", "slots", "subType", "type", "updatedAt", "weaponLevel", "weight") SELECT "aegisName", "armorLevel", "attack", coalesce("buy", 0) AS "buy", coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "defense", "equipLevelMin", "id", "magicAttack", "name", "range", coalesce("refineable", false) AS "refineable", coalesce("sell", 0) AS "sell", "slots", "subType", "type", "updatedAt", "weaponLevel", coalesce("weight", 0) AS "weight" FROM "items";
DROP TABLE "items";
ALTER TABLE "new_items" RENAME TO "items";
CREATE UNIQUE INDEX "items_aegisName_key" ON "items"("aegisName");
CREATE INDEX "items_type_idx" ON "items"("type");
CREATE INDEX "items_subType_idx" ON "items"("subType");
CREATE INDEX "items_name_idx" ON "items"("name");
CREATE TABLE "new_mob_drops" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mobId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "rate" INTEGER NOT NULL,
    "stealProtected" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "mob_drops_mobId_fkey" FOREIGN KEY ("mobId") REFERENCES "mobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mob_drops_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_mob_drops" ("itemId", "mobId", "rate", "stealProtected") SELECT "itemId", "mobId", "rate", coalesce("stealProtected", false) AS "stealProtected" FROM "mob_drops";
DROP TABLE "mob_drops";
ALTER TABLE "new_mob_drops" RENAME TO "mob_drops";
CREATE INDEX "mob_drops_itemId_idx" ON "mob_drops"("itemId");
CREATE UNIQUE INDEX "mob_drops_mobId_itemId_key" ON "mob_drops"("mobId", "itemId");
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
INSERT INTO "new_mobs" ("aegisName", "agi", "ai", "attack", "attack2", "attackDelay", "attackMotion", "attackRange", "baseExp", "chaseRange", "createdAt", "damageMotion", "defense", "dex", "element", "elementLevel", "hp", "id", "int", "jobExp", "level", "luk", "magicDefense", "name", "race", "size", "skillRange", "sp", "str", "updatedAt", "vit", "walkSpeed") SELECT "aegisName", coalesce("agi", 1) AS "agi", coalesce("ai", '01') AS "ai", coalesce("attack", 0) AS "attack", coalesce("attack2", 0) AS "attack2", coalesce("attackDelay", 2000) AS "attackDelay", coalesce("attackMotion", 720) AS "attackMotion", coalesce("attackRange", 1) AS "attackRange", coalesce("baseExp", 0) AS "baseExp", coalesce("chaseRange", 12) AS "chaseRange", coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", coalesce("damageMotion", 480) AS "damageMotion", coalesce("defense", 0) AS "defense", coalesce("dex", 1) AS "dex", coalesce("element", 'Neutral') AS "element", coalesce("elementLevel", 1) AS "elementLevel", coalesce("hp", 1) AS "hp", "id", coalesce("int", 1) AS "int", coalesce("jobExp", 0) AS "jobExp", coalesce("level", 1) AS "level", coalesce("luk", 1) AS "luk", coalesce("magicDefense", 0) AS "magicDefense", "name", coalesce("race", 'Formless') AS "race", coalesce("size", 'Small') AS "size", coalesce("skillRange", 10) AS "skillRange", coalesce("sp", 1) AS "sp", coalesce("str", 1) AS "str", "updatedAt", coalesce("vit", 1) AS "vit", coalesce("walkSpeed", 200) AS "walkSpeed" FROM "mobs";
DROP TABLE "mobs";
ALTER TABLE "new_mobs" RENAME TO "mobs";
CREATE UNIQUE INDEX "mobs_aegisName_key" ON "mobs"("aegisName");
CREATE INDEX "mobs_level_idx" ON "mobs"("level");
CREATE INDEX "mobs_race_idx" ON "mobs"("race");
CREATE INDEX "mobs_element_idx" ON "mobs"("element");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "character_equipment_itemId_idx" ON "character_equipment"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "character_equipment_characterId_slot_key" ON "character_equipment"("characterId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "skills_aegisName_key" ON "skills"("aegisName");

-- CreateIndex
CREATE INDEX "skills_type_idx" ON "skills"("type");

-- CreateIndex
CREATE INDEX "skills_targetType_idx" ON "skills"("targetType");

-- CreateIndex
CREATE INDEX "skill_levels_skillId_idx" ON "skill_levels"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_levels_skillId_level_key" ON "skill_levels"("skillId", "level");

-- CreateIndex
CREATE INDEX "skill_requirements_skillId_idx" ON "skill_requirements"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_requirements_skillId_level_key" ON "skill_requirements"("skillId", "level");

-- CreateIndex
CREATE INDEX "skill_requirement_items_requirementId_idx" ON "skill_requirement_items"("requirementId");

-- CreateIndex
CREATE INDEX "skill_requirement_items_itemId_idx" ON "skill_requirement_items"("itemId");

-- CreateIndex
CREATE INDEX "skill_units_skillId_idx" ON "skill_units"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_unit_levels_skillUnitId_level_key" ON "skill_unit_levels"("skillUnitId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "game_classes_aegisName_key" ON "game_classes"("aegisName");

-- CreateIndex
CREATE INDEX "game_classes_parentId_idx" ON "game_classes"("parentId");

-- CreateIndex
CREATE INDEX "game_classes_heleonaireClass_idx" ON "game_classes"("heleonaireClass");

-- CreateIndex
CREATE INDEX "class_skills_skillId_idx" ON "class_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "class_skills_classId_skillId_key" ON "class_skills"("classId", "skillId");

-- CreateIndex
CREATE INDEX "skill_prerequisites_requiredSkillId_idx" ON "skill_prerequisites"("requiredSkillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_prerequisites_skillId_requiredSkillId_key" ON "skill_prerequisites"("skillId", "requiredSkillId");

-- CreateIndex
CREATE INDEX "character_skills_skillId_idx" ON "character_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "character_skills_characterId_skillId_key" ON "character_skills"("characterId", "skillId");

-- CreateIndex
CREATE INDEX "class_stat_growth_classId_idx" ON "class_stat_growth"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "class_stat_growth_classId_level_key" ON "class_stat_growth"("classId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "class_base_points_classId_level_key" ON "class_base_points"("classId", "level");

-- CreateIndex
CREATE INDEX "class_aspd_classId_idx" ON "class_aspd"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "class_aspd_classId_weaponType_key" ON "class_aspd"("classId", "weaponType");

-- CreateIndex
CREATE UNIQUE INDEX "status_effects_aegisName_key" ON "status_effects"("aegisName");

-- CreateIndex
CREATE INDEX "status_effects_type_idx" ON "status_effects"("type");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_modifiers_attackerElement_defenderElement_level_key" ON "attribute_modifiers"("attackerElement", "defenderElement", "level");

-- CreateIndex
CREATE UNIQUE INDEX "size_modifiers_weaponType_targetSize_key" ON "size_modifiers"("weaponType", "targetSize");

-- CreateIndex
CREATE INDEX "level_penalties_levelDifference_idx" ON "level_penalties"("levelDifference");

-- CreateIndex
CREATE UNIQUE INDEX "exp_tables_type_level_key" ON "exp_tables"("type", "level");

-- CreateIndex
CREATE UNIQUE INDEX "statpoint_table_level_key" ON "statpoint_table"("level");

-- CreateIndex
CREATE UNIQUE INDEX "item_combo_entries_comboId_itemId_key" ON "item_combo_entries"("comboId", "itemId");

-- CreateIndex
CREATE INDEX "data_imports_dataset_idx" ON "data_imports"("dataset");

-- CreateIndex
CREATE INDEX "data_imports_importedAt_idx" ON "data_imports"("importedAt");
