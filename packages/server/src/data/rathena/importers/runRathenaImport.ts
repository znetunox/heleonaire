import { prisma } from "../../../db/prisma";
import { importItems } from "./itemImporter";
import { importMobs } from "./mobImporter";
import { importDrops } from "./dropImporter";

async function main() {
  const start = Date.now();

  console.log("");
  console.log("=========================================");
  console.log("        rAthena DATABASE IMPORT");
  console.log("=========================================");
  console.log("");

  try {
    // ============================================================
    // 1. ITEMS
    // ============================================================

    console.log("[1/3] Importing items...");

    const items = await importItems();

    if (items.failed > 0) {
      console.error(
        "[rAthena] Item import failed. Aborting before mobs/drops."
      );

      process.exitCode = 1;
      return;
    }

    // ============================================================
    // 2. MOBS
    // ============================================================

    console.log("[2/3] Importing mobs...");

    const mobs = await importMobs();

    if (mobs.failed > 0) {
      console.error(
        "[rAthena] Mob import failed. Aborting before drops."
      );

      process.exitCode = 1;
      return;
    }

    // ============================================================
    // 3. DROPS
    // ============================================================

    console.log("[3/3] Importing drops...");

    const drops = await importDrops();

    // ============================================================
    // SUMMARY
    // ============================================================

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log("");
    console.log("=========================================");
    console.log("        rAthena IMPORT COMPLETE");
    console.log("=========================================");
    console.log("");

    console.log("ITEMS");
    console.log(`  Parsed:     ${items.items}`);
    console.log(`  Duplicates: ${items.duplicates}`);
    console.log(`  Imported:   ${items.imported}`);
    console.log(`  Failed:     ${items.failed}`);
    console.log("");

    console.log("MOBS");
    console.log(`  Parsed:     ${mobs.mobs}`);
    console.log(`  Duplicates: ${mobs.duplicates}`);
    console.log(`  Imported:   ${mobs.imported}`);
    console.log(`  Failed:     ${mobs.failed}`);
    console.log("");

    console.log("DROPS");
    console.log(`  Mobs:       ${drops.mobs}`);
    console.log(`  Parsed:     ${drops.dropsParsed}`);
    console.log(`  Imported:   ${drops.dropsImported}`);
    console.log(`  Missing:    ${drops.missingItems}`);
    console.log(`  Failed:     ${drops.failed}`);
    console.log("");

    console.log(`Total time: ${elapsed}s`);
    console.log("");

    if (drops.missingItems > 0 || drops.failed > 0) {
      console.error("[rAthena] Import finished with errors.");
      process.exitCode = 1;
      return;
    }

    console.log("[rAthena] Import successful.");
  } catch (error) {
    console.error("");
    console.error("[rAthena] Fatal import error:");
    console.error(error);

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();