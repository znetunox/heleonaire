import { prisma } from "../db/prisma";

export async function validateDrops() {
  const itemCount = await prisma.item.count();
  const mobCount = await prisma.mob.count();
  const dropEntryCount = await prisma.dropEntry.count();

  const sampleDropEntries = await prisma.dropEntry.findMany({
    take: 5,
    include: {
      mob: true,
      item: true,
    },
  });

  console.log("Validação de Drops:");
  console.log(`Items no banco: ${itemCount}`);
  console.log(`Mobs no banco: ${mobCount}`);
  console.log(`DropEntries no banco: ${dropEntryCount}`);
  console.log("\nAmostra de DropEntries:");
  console.log(JSON.stringify(sampleDropEntries, null, 2));
}

async function main() {
  try {
    await validateDrops();
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

main();
