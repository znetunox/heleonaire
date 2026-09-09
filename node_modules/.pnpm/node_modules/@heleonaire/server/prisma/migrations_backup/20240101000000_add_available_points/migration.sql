-- migrate:up
ALTER TABLE "Character" ADD COLUMN "availablePoints" INTEGER DEFAULT 0;
-- migrate:down
ALTER TABLE "Character" DROP COLUMN "availablePoints";