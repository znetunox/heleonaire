import prisma from "./src/db/prisma";

async function main() {
    const item = await prisma.item.findUnique({
        where: {
            id: 501,
        },
        select: {
            id: true,
            name: true,
            aegisName: true,
            type: true,
            script: true,
        },
    });

    console.log(item);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
