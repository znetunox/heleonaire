import { parseMobs } from "./parsers/mobParser";

function main() {
  const { mobs, duplicates } = parseMobs();

  let totalDrops = 0;
  let duplicateItemEntries = 0;

  const missingItemNames = new Set<string>();

  for (const mob of mobs.values()) {
    const seenItems = new Map<string, number>();

    for (const drop of mob.drops) {
      totalDrops++;

      const count = seenItems.get(drop.item) ?? 0;

      if (count > 0) {
        duplicateItemEntries++;
      }

      seenItems.set(drop.item, count + 1);
    }
  }

  console.log("");
  console.log("========================================");
  console.log("        rAthena DROP AUDIT");
  console.log("========================================");
  console.log("");

  console.log(`Mobs:                  ${mobs.size}`);
  console.log(`Mob duplicates:        ${duplicates}`);
  console.log(`Total drop entries:    ${totalDrops}`);
  console.log(`Duplicate item entries:${duplicateItemEntries}`);
  console.log(`Missing items:         ${missingItemNames.size}`);

  console.log("");
  console.log("========================================");
  console.log("        EXEMPLO: PORING");
  console.log("========================================");
  console.log("");

  const poring = mobs.get(1002);

  if (!poring) {
    console.log("Poring #1002 não encontrado.");
    return;
  }

  console.log(`Mob: ${poring.name}`);
  console.log(`Drops: ${poring.drops.length}`);
  console.log("");

  poring.drops.forEach((drop, index) => {
    console.log(
      `[${index}] ${drop.item} | rate=${drop.rate} | stealProtected=${drop.stealProtected}`
    );
  });

  console.log("");
}

main();