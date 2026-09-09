import prisma from "../../../db/prisma";

async function main() {
  console.log("[Migration] Checking DropEntry sourceKeys...");

  const drops = await prisma.dropEntry.findMany({
    where: {
      sourceKey: {
        contains: " ",
      },
    },
    select: {
      id: true,
      sourceKey: true,
    },
  });

  console.log(`[Migration] Found: ${drops.length}`);

  if (drops.length === 0) {
    console.log("[Migration] Nothing to fix.");
    return;
  }

  const normalizedKeys = drops.map((drop) => ({
    id: drop.id,
    oldKey: drop.sourceKey!,
    newKey: drop.sourceKey!.trim(),
  }));

  const newKeys = normalizedKeys.map((drop) => drop.newKey);

  const existing = await prisma.dropEntry.findMany({
    where: {
      sourceKey: {
        in: newKeys,
      },
    },
    select: {
      id: true,
      sourceKey: true,
    },
  });

  if (existing.length > 0) {
    console.error(
      `[Migration] ABORTED: ${existing.length} normalized keys already exist.`
    );

    console.dir(existing.slice(0, 20), { depth: 3 });

    process.exitCode = 1;
    return;
  }

  console.log("[Migration] No normalized-key collisions found.");
  console.log("[Migration] Updating sourceKeys...");

  let updated = 0;

  for (const drop of normalizedKeys) {
    await prisma.dropEntry.update({
      where: {
        id: drop.id,
      },
      data: {
        sourceKey: drop.newKey,
      },
    });

    updated++;

    if (updated % 500 === 0) {
      console.log(
        `[Migration] Progress: ${updated}/${normalizedKeys.length}`
      );
    }
  }

  console.log("");
  console.log("[Migration] Complete.");
  console.log(`[Migration] Updated: ${updated}`);
}

main()
  .catch((error) => {
    console.error("[Migration] Fatal error:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });