import { prisma } from "../../../db/prisma";
import { parseMobs } from "../parsers/mobParser";

export interface DropImportResult {
  mobs: number;
  dropsParsed: number;
  dropsImported: number;
  missingItems: number;
  failed: number;
}

export async function importDrops(): Promise<DropImportResult> {
  console.log("[rAthena] Reading mob_db.yml...");

  const { mobs } = parseMobs();

  console.log(`[rAthena] Mobs: ${ mobs.size } `);

  /*
   * Carrega todos os itens uma única vez.
   *
   * Não devemos fazer findUnique() para cada drop.
   * Os itens são indexados por aegisName para
   * que cada drop possa ser resolvido em memória.
   */
  const items = await prisma.item.findMany({
    select: {
      id: true,
      aegisName: true,
    },
  });

  const itemsByAegisName = new Map(
    items.map((item) => [item.aegisName, item.id])
  );

  console.log(`[DropImporter] Items available: ${ items.length } `);
  console.log("");

  let dropsParsed = 0;
  let dropsImported = 0;
  let missingItems = 0;
  let failed = 0;

  /*
   * Processamos cada mob individualmente.
   *
   * Isso permite reconciliar os drops daquele mob:
   * se uma entrada antiga desaparecer do rAthena,
   * ela será removida do banco.
   */
  for (const mob of mobs.values()) {
    const validSourceKeys = new Set<string>();

    for (let index = 0; index < mob.drops.length; index++) {
      const drop = mob.drops[index];

      dropsParsed++;

      const itemId = itemsByAegisName.get(drop.item);

      if (itemId === undefined) {
        console.error(
          `[DropImporter] Missing item: ${ drop.item } ` +
          `(mob ${ mob.id } ${ mob.name })`
        );

        missingItems++;
        continue;
      }

      /*
       * A posição do drop no mob_db.yml faz parte
       * da identidade original da entrada rAthena.
       *
       * Exemplo:
       * rathena:1002:0
       * rathena:1002:1
       */
      const sourceKey = `rathena:${ mob.id }:${ index } `;

      validSourceKeys.add(sourceKey);

      try {
        await prisma.dropEntry.upsert({
          where: {
            sourceKey,
          },

          create: {
            mobId: mob.id,
            itemId,
            rate: drop.rate,
            stealProtected: drop.stealProtected ?? false,
            sourceKey,
          },

          update: {
            mobId: mob.id,
            itemId,
            rate: drop.rate,
            stealProtected: drop.stealProtected ?? false,
          },
        });

        dropsImported++;

        if (dropsImported % 500 === 0) {
          console.log(
            `[DropImporter] Progress: ${ dropsImported }/${dropsParsed}`
          );
        }
      } catch (error) {
    failed++;

    console.error(
        `[DropImporter] Failed: ` +
        `mob=${mob.id} ` +
        `item=${drop.item} ` +
        `index=${index}`
    );

    console.error(error);
}
    }

/*
 * Remove entradas antigas desse mob que não existem
 * mais na fonte atual do rAthena.
 *
 * Isso torna o importer um sincronizador, e não apenas
 * um "insert".
 */
if (validSourceKeys.size > 0) {
    await prisma.dropEntry.deleteMany({
        where: {
            mobId: mob.id,
            sourceKey: {
                not: null,
                notIn: Array.from(validSourceKeys),
            },
        },
    });
} else {
    /*
     * Se o mob não possui nenhum drop atualmente,
     * removemos os drops importados anteriormente.
     */
    await prisma.dropEntry.deleteMany({
        where: {
            mobId: mob.id,
            sourceKey: {
                not: null,
            },
        },
    });
}
  }

return {
    mobs: mobs.size,
    dropsParsed,
    dropsImported,
    missingItems,
    failed,
};
}