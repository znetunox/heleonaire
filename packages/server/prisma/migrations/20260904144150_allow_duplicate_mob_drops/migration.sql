-- DropIndex
DROP INDEX "mob_drops_mobId_itemId_key";

-- CreateIndex
CREATE INDEX "mob_drops_mobId_idx" ON "mob_drops"("mobId");

-- CreateIndex
CREATE INDEX "mob_drops_mobId_itemId_idx" ON "mob_drops"("mobId", "itemId");
