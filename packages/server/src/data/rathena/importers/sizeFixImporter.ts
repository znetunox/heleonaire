import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";

import {
  parseSizeFix,
  ParsedSizeFixRule,
} from "../parsers/sizeFixParser";

const prisma = new PrismaClient();

const DATASET = "size_fix_data";
const SOURCE = "rathena";
const SOURCE_VERSION = "db/re";

function hash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function normalizeWeaponType(value: string): string {
  return value.trim();
}

function validateRules(
  rules: ParsedSizeFixRule[]
): void {
  if (rules.length === 0) {
    throw new Error(
      "size_fix.yml produced zero Size Fix rules. Import aborted."
    );
  }

  const weaponTypes = new Set<string>();

  for (const rule of rules) {
    const weaponType =
      normalizeWeaponType(rule.weaponType);

    if (!weaponType) {
      throw new Error(
        "Size Fix rule has an empty Weapon type."
      );
    }

    if (weaponTypes.has(weaponType)) {
      throw new Error(
        `Duplicate Size Fix rule detected: ${weaponType}`
      );
    }

    weaponTypes.add(weaponType);

    for (const [size, value] of [
      ["Small", rule.small],
      ["Medium", rule.medium],
      ["Large", rule.large],
    ] as const) {
      if (
        !Number.isInteger(value) ||
        value < 0 ||
        value > 100
      ) {
        throw new Error(
          [
            "Invalid Size Fix value:",
            weaponType,
            size,
            value,
            "Expected integer 0..100.",
          ].join(" ")
        );
      }
    }
  }
}

async function importSizeFixData() {
  console.log(
    "[rAthena] Starting Size Fix DB import..."
  );

  const parsed = parseSizeFix(
    `${process.cwd()}/../../rathena-master/db/re/size_fix.yml`
  );

  console.log(
    `[rAthena] size_fix.yml source: ${SOURCE}`
  );

  console.log(
    `[rAthena] Size Fix rules parsed: ${parsed.rules.length}`
  );

  console.log(
    `[rAthena] Size Fix duplicates: ${parsed.duplicates}`
  );

  if (parsed.duplicates > 0) {
    throw new Error(
      [
        `size_fix.yml contains ${parsed.duplicates}`,
        "duplicate Size Fix rule(s).",
      ].join(" ")
    );
  }

  // ----------------------------------------------------------
  // BASIC VALIDATION
  // ----------------------------------------------------------

  validateRules(parsed.rules);

  // ----------------------------------------------------------
  // EXPECTED COUNTS
  // ----------------------------------------------------------

  const expectedRules =
    parsed.rules.length;

  console.log(
    `[rAthena] expected SizeFixRule records: ${expectedRules}`
  );

  // ----------------------------------------------------------
  // IMPORT
  // ----------------------------------------------------------

  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsDeleted = 0;

  try {
    await prisma.$transaction(
      async (tx) => {
        const importedWeaponTypes =
          parsed.rules.map(
            (rule) =>
              normalizeWeaponType(
                rule.weaponType
              )
          );

        // ----------------------------------------------------
        // REMOVE STALE RULES
        //
        // Only weapon types present in the current
        // rAthena dataset are synchronized.
        // ----------------------------------------------------

        const existingRules =
          await tx.sizeFixRule.findMany({
            select: {
              id: true,
              weaponType: true,
            },
          });

        const importedSet =
          new Set(importedWeaponTypes);

        const staleRuleIds =
          existingRules
            .filter(
              (rule) =>
                !importedSet.has(
                  rule.weaponType
                )
            )
            .map(
              (rule) => rule.id
            );

        if (staleRuleIds.length > 0) {
          const deleted =
            await tx.sizeFixRule.deleteMany({
              where: {
                id: {
                  in: staleRuleIds,
                },
              },
            });

          recordsDeleted +=
            deleted.count;
        }

        // ----------------------------------------------------
        // UPSERT RULES
        // ----------------------------------------------------

        for (const rule of parsed.rules) {
          const weaponType =
            normalizeWeaponType(
              rule.weaponType
            );

          const sourceHash =
            hash(rule);

          const existing =
            await tx.sizeFixRule.findUnique({
              where: {
                weaponType,
              },
              select: {
                id: true,
              },
            });

          await tx.sizeFixRule.upsert({
            where: {
              weaponType,
            },

            create: {
              weaponType,

              small: rule.small,
              medium: rule.medium,
              large: rule.large,

              source: SOURCE,
              sourceHash,
            },

            update: {
              small: rule.small,
              medium: rule.medium,
              large: rule.large,

              source: SOURCE,
              sourceHash,
            },
          });

          if (existing) {
            recordsUpdated++;
          } else {
            recordsCreated++;
          }
        }
      },
      {
        timeout: 120000,
      }
    );

    // --------------------------------------------------------
    // DATA IMPORT TRACKING
    // --------------------------------------------------------

    await prisma.dataImport.create({
      data: {
        dataset: DATASET,
        source: SOURCE,
        sourceVersion:
          SOURCE_VERSION,

        recordsCreated,
        recordsUpdated,
        recordsDeleted,

        success: true,
      },
    });

    console.log("");
    console.log(
      "=============================================="
    );
    console.log(
      "Size Fix DB import completed successfully"
    );
    console.log(
      "=============================================="
    );

    console.log(
      `Size Fix rules:       ${expectedRules}`
    );

    console.log(
      `Records created:      ${recordsCreated}`
    );

    console.log(
      `Records updated:      ${recordsUpdated}`
    );

    console.log(
      `Records deleted:      ${recordsDeleted}`
    );

    console.log(
      "=============================================="
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    await prisma.dataImport.create({
      data: {
        dataset: DATASET,
        source: SOURCE,
        sourceVersion:
          SOURCE_VERSION,

        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,

        success: false,
        errorMessage,
      },
    });

    console.error("");
    console.error(
      "=============================================="
    );
    console.error(
      "Size Fix DB import FAILED"
    );
    console.error(
      "=============================================="
    );
    console.error(errorMessage);
    console.error(
      "=============================================="
    );

    throw error;
  }
}

// ------------------------------------------------------------
// ENTRY POINT
// ------------------------------------------------------------

if (require.main === module) {
  importSizeFixData()
    .catch(() => {
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { importSizeFixData };