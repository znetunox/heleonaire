-- CreateTable
CREATE TABLE "class_stat_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" INTEGER NOT NULL,
    "maxWeight" INTEGER,
    "hpFactor" INTEGER,
    "hpIncrease" INTEGER,
    "spFactor" INTEGER,
    "spIncrease" INTEGER,
    "apFactor" INTEGER,
    "apIncrease" INTEGER,
    CONSTRAINT "class_stat_configs_classId_fkey" FOREIGN KEY ("classId") REFERENCES "game_classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "class_stat_configs_classId_key" ON "class_stat_configs"("classId");
