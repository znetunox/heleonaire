import prisma from "./src/db/prisma";

async function main() {
    const c = await prisma.character.findUnique({
        where: {
            name: "Dada",
        },
    });

    console.log(
        c
            ? {
                  id: c.id,
                  name: c.name,
                  hp: c.hp,
                  mp: c.mp,
              }
            : "Personagem não encontrado",
    );

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});