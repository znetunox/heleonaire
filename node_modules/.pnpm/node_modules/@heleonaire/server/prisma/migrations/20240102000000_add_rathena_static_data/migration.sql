-- Add rAthena static data tables (Item, Mob, DropEntry)
-- Preserves existing accounts, characters, inventory

CREATE TABLE IF NOT EXISTS "items" (
  "id" INTEGER PRIMARY KEY CHECK("id" > 0) UNIQUE,
  "aegisName" TEXT UNIQUE,
  "name" TEXT,
  "type" TEXT,
  "subType" TEXT,
  "buy" INTEGER,
  "sell" INTEGER,
  "weight" REAL,
  "attack" INTEGER,
  "magicAttack" INTEGER,
  "defense" INTEGER,
  "range" INTEGER,
  "slots" INTEGER,
  "weaponLevel" INTEGER,
  "armorLevel" INTEGER,
  "equipLevelMin" INTEGER,
  "refineable" INTEGER DEFAULT 0,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "mobs" (
  "id" INTEGER PRIMARY KEY CHECK("id" > 0) UNIQUE,
  "aegisName" TEXT UNIQUE,
  "name" TEXT,
  "level" INTEGER,
  "hp" INTEGER,
  "sp" INTEGER,
  "baseExp" INTEGER,
  "jobExp" INTEGER,
  "attack" INTEGER,
  "attack2" INTEGER,
  "defense" INTEGER,
  "magicDefense" INTEGER,
  "str" INTEGER,
  "agi" INTEGER,
  "vit" INTEGER,
  "int" INTEGER,
  "dex" INTEGER,
  "luk" INTEGER,
  "attackRange" INTEGER,
  "skillRange" INTEGER,
  "chaseRange" INTEGER,
  "size" TEXT,
  "race" TEXT,
  "element" TEXT,
  "elementLevel" INTEGER,
  "walkSpeed" INTEGER,
  "attackDelay" INTEGER,
  "attackMotion" INTEGER,
  "damageMotion" INTEGER,
  "ai" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "mob_drops" (
  "mobId" INTEGER NOT NULL,
  "itemId" INTEGER NOT NULL,
  "rate" INTEGER DEFAULT 100,
  "stealProtected" INTEGER DEFAULT 0,
  PRIMARY KEY ("mobId", "itemId"),
  FOREIGN KEY ("mobId") REFERENCES "mobs"("id") ON DELETE CASCADE,
  FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE
);
