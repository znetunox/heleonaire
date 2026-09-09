import prisma from "./src/db/prisma";

async function main() {
  const items = await prisma.item.findMany({
    where: {
      type: {
        in: ["Armor", "Shadowgear"],
      },
      OR: [
        { locations: { contains: "Armor" } },
        { locations: { contains: "Shadow" } },
        { type: "Shadowgear" },
      ],
    },
    select: {
      id: true,
      name: true,
      type: true,
      subType: true,
      attack: true,
      magicAttack: true,
      defense: true,
      locations: true,
      armorLevel: true,
    },
    take: 50,
  });

  console.table(items);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());