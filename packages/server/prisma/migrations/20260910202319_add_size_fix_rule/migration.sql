-- CreateTable
CREATE TABLE "SizeFixRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weaponType" TEXT NOT NULL,
    "small" INTEGER NOT NULL DEFAULT 100,
    "medium" INTEGER NOT NULL DEFAULT 100,
    "large" INTEGER NOT NULL DEFAULT 100,
    "source" TEXT NOT NULL DEFAULT 'rathena',
    "sourceHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SizeFixRule_weaponType_key" ON "SizeFixRule"("weaponType");
