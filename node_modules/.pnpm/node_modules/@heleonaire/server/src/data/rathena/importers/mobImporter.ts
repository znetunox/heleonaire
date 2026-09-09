import { createHash } from "crypto";
import { prisma } from "../../../db/prisma";
import { parseMobs, ParsedMob } from "../parsers/mobParser";

export interface MobImportResult {
  mobs: number;
  duplicates: number;
  imported: number;
  failed: number;
}

function calculateSourceHash(mob: ParsedMob): string {
  return createHash("sha256")
    .update(JSON.stringify(mob))
    .digest("hex");
}

async function importMob(mob: ParsedMob): Promise<void> {
  const sourceHash = calculateSourceHash(mob);

  await prisma.mob.upsert({
    where: {
      id: mob.id,
    },

    create: {
      id: mob.id,
      aegisName: mob.aegisName,
      name: mob.name,

      level: mob.level,

      hp: mob.hp,
      sp: mob.sp,

      baseExp: mob.baseExp,
      jobExp: mob.jobExp,

      attack: mob.attack,
      attack2: mob.attack2,

      defense: mob.defense,
      magicDefense: mob.magicDefense,

      str: mob.str,
      agi: mob.agi,
      vit: mob.vit,
      int: mob.int,
      dex: mob.dex,
      luk: mob.luk,

      attackRange: mob.attackRange,
      skillRange: mob.skillRange,
      chaseRange: mob.chaseRange,

      size: mob.size,
      race: mob.race,
      element: mob.element,
      elementLevel: mob.elementLevel,

      walkSpeed: mob.walkSpeed,
      attackDelay: mob.attackDelay,
      attackMotion: mob.attackMotion,
      damageMotion: mob.damageMotion,

      ai: mob.ai,

      source: "rathena",
      sourceHash,
    },

    update: {
      aegisName: mob.aegisName,
      name: mob.name,

      level: mob.level,

      hp: mob.hp,
      sp: mob.sp,

      baseExp: mob.baseExp,
      jobExp: mob.jobExp,

      attack: mob.attack,
      attack2: mob.attack2,

      defense: mob.defense,
      magicDefense: mob.magicDefense,

      str: mob.str,
      agi: mob.agi,
      vit: mob.vit,
      int: mob.int,
      dex: mob.dex,
      luk: mob.luk,

      attackRange: mob.attackRange,
      skillRange: mob.skillRange,
      chaseRange: mob.chaseRange,

      size: mob.size,
      race: mob.race,
      element: mob.element,
      elementLevel: mob.elementLevel,

      walkSpeed: mob.walkSpeed,
      attackDelay: mob.attackDelay,
      attackMotion: mob.attackMotion,
      damageMotion: mob.damageMotion,

      ai: mob.ai,

      source: "rathena",
      sourceHash,
    },
  });
}

export async function importMobs(): Promise<MobImportResult> {
  console.log("[rAthena] Reading mob_db.yml...");

  const result = parseMobs();

  console.log(`[rAthena] Mobs parsed: ${ result.mobs.size } `);
  console.log(`[rAthena] Duplicates:    ${ result.duplicates } `);
  console.log("");

  let imported = 0;
  let failed = 0;

  const start = Date.now();

  for (const mob of result.mobs.values()) {
    try {
      await importMob(mob);

      imported++;

      if (imported % 500 === 0) {
        console.log(
          `[MobImporter] Progress: ${ imported }/${result.mobs.size}`
        );
      }
    } catch (error) {
    failed++;

    console.error(
        `[MobImporter] Failed: mob=${mob.id} (${mob.aegisName})`
    );

    console.error(error);
}
  }

const elapsed = ((Date.now() - start) / 1000).toFixed(2);

console.log("");
console.log("[MobImporter] Import finished.");
console.log(`[MobImporter] Parsed:     ${result.mobs.size}`);
console.log(`[MobImporter] Duplicates: ${result.duplicates}`);
console.log(`[MobImporter] Imported:   ${imported}`);
console.log(`[MobImporter] Failed:     ${failed}`);
console.log(`[MobImporter] Time:       ${elapsed}s`);
console.log("");

return {
    mobs: result.mobs.size,
    duplicates: result.duplicates,
    imported,
    failed,
};
}