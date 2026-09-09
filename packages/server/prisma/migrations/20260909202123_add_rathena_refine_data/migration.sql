-- CreateTable
CREATE TABLE "refine_rules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "group" TEXT NOT NULL,
    "itemLevel" INTEGER NOT NULL,
    "refineLevel" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "randomBonus" INTEGER NOT NULL DEFAULT 0,
    "blacksmithBlessingAmount" INTEGER NOT NULL DEFAULT 0,
    "broadcastSuccess" BOOLEAN NOT NULL DEFAULT false,
    "broadcastFailure" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'rathena',
    "sourceHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "refine_chances" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "refineRuleId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "rate" INTEGER NOT NULL DEFAULT 0,
    "price" INTEGER NOT NULL DEFAULT 0,
    "materialItemId" INTEGER,
    "breakingRate" INTEGER NOT NULL DEFAULT 0,
    "downgradeAmount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "refine_chances_refineRuleId_fkey" FOREIGN KEY ("refineRuleId") REFERENCES "refine_rules" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refine_chances_materialItemId_fkey" FOREIGN KEY ("materialItemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "refine_rules_group_idx" ON "refine_rules"("group");

-- CreateIndex
CREATE INDEX "refine_rules_group_itemLevel_idx" ON "refine_rules"("group", "itemLevel");

-- CreateIndex
CREATE UNIQUE INDEX "refine_rules_group_itemLevel_refineLevel_key" ON "refine_rules"("group", "itemLevel", "refineLevel");

-- CreateIndex
CREATE INDEX "refine_chances_refineRuleId_idx" ON "refine_chances"("refineRuleId");

-- CreateIndex
CREATE INDEX "refine_chances_materialItemId_idx" ON "refine_chances"("materialItemId");

-- CreateIndex
CREATE UNIQUE INDEX "refine_chances_refineRuleId_type_key" ON "refine_chances"("refineRuleId", "type");
