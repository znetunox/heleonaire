-- Baseline migration: Account, Character, Inventory
-- Represents the current state of the database before adding Item, Mob, DropEntry
-- DO NOT EXECUTE THIS FILE

-- Table: accounts
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Table: characters
CREATE TABLE IF NOT EXISTS "characters" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "name" TEXT NOT NULL UNIQUE,
  "class" TEXT NOT NULL,
  "faction" TEXT NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 1,
  "baseExp" BIGINT NOT NULL DEFAULT 0,
  "jobExp" BIGINT NOT NULL DEFAULT 0,
  "hp" INTEGER NOT NULL DEFAULT 100,
  "maxHp" INTEGER NOT NULL DEFAULT 100,
  "mp" INTEGER NOT NULL DEFAULT 50,
  "maxMp" INTEGER NOT NULL DEFAULT 50,
  "str" INTEGER NOT NULL DEFAULT 1,
  "agi" INTEGER NOT NULL DEFAULT 1,
  "vit" INTEGER NOT NULL DEFAULT 1,
  "int" INTEGER NOT NULL DEFAULT 1,
  "dex" INTEGER NOT NULL DEFAULT 1,
  "luk" INTEGER NOT NULL DEFAULT 1,
  "availablePoints" INTEGER NOT NULL DEFAULT 0,
  "mapId" TEXT NOT NULL DEFAULT 'plains_of_ash',
  "posX" REAL NOT NULL DEFAULT 200,
  "posY" REAL NOT NULL DEFAULT 200,
  "gold" BIGINT NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
);

-- Table: inventory
CREATE TABLE IF NOT EXISTS "inventory" (
  "id" TEXT PRIMARY KEY,
  "characterId" TEXT NOT NULL,
  "itemId" INTEGER NOT NULL,
  "itemName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "slot" INTEGER NOT NULL DEFAULT -1,
  "isEquipped" BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE
);
