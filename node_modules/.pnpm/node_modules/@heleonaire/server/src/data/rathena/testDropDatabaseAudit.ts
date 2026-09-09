import { PrismaClient } from "@prisma/client";
import { parseMobs } from "./parsers/mobParser";

const prisma = new PrismaClient();

async function main() {
  const { mobs, duplicates } = parseMobs();

  const items = await prisma.item.findMany({
    select: {
      id: true,
      aegisName: true,
      name: true,
    },
  });

  const itemsByAegisName = new Map(
    items.map((item) => [item.aegisName, item])
  );

  let totalDrops = 0;
  let duplicateItemEntries = 0;

  const missingItems = new Map<string, number>();

  for (const mob of mobs.values()) {
    const seenItems = new Map<string, number>();

    for (const drop of mob.drops) {
      totalDrops++;

      const count = seenItems.get(drop.item) ?? 0;

      if (count > 0) {
        duplicateItemEntries++;
      }

      seenItems.set(drop.item, count + 1);

      if (!itemsByAegisName.has(drop.item)) {
        missingItems.set(
          drop.item,
          (missingItems.get(drop.item) ?? 0) + 1
        );
      }
    }
  }

  console.log("");
  console.log("========================================");
  console.log("       rAthena DROP DATABASE AUDIT");
  console.log("========================================");
  console.log("");

  console.log(`Mobs:                   ${mobs.size}`);
  console.log(`Mob duplicates:         ${duplicates}`);
  console.log(`Items in DB:            ${items.length}`);
  console.log(`Total drop entries:     ${totalDrops}`);
  console.log(`Duplicate item entries: ${duplicateItemEntries}`);
  console.log(`Missing items:          ${missingItems.size}`);

  console.log("");

  if (missingItems.size > 0) {
    console.log("========================================");
    console.log("          MISSING ITEMS");
    console.log("========================================");
    console.log("");

    for (const [item, count] of missingItems.entries()) {
      console.log(`${item} (${count} occurrence(s))`);
    }

    console.log("");
  }

  console.log("========================================");
  console.log("              PORING");
  console.log("========================================");
  console.log("");

  const poring = mobs.get(1002);

  if (poring) {
    console.log(`Mob: ${poring.name}`);
    console.log(`Drops: ${poring.drops.length}`);
    console.log("");

    poring.drops.forEach((drop, index) => {
      const item = itemsByAegisName.get(drop.item);

      console.log(
        `[${index}] ${drop.item}` +
          ` → itemId=${item?.id ?? "MISSING"}` +
          ` | rate=${drop.rate}` +
          ` | stealProtected=${drop.stealProtected}`
      );
    });
  }

  console.log("");
  console.log("========================================");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});