const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  console.log('=== TABELAS EXISTENTES ===');
  const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`;
  console.log(tables);

  console.log('\n=== _prisma_migrations (se existir) ===');
  try {
    const migrations = await prisma.$queryRaw`SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at`;
    console.log(migrations);
  } catch (e) {
    console.log('Tabela não existe:', e.message);
  }

  console.log('\n=== Character (se existir) ===');
  try {
    const schema = await prisma.$queryRaw`PRAGMA table_info("Character")`;
    console.log(schema);
  } catch (e) {
    console.log('Tabela não existe:', e.message);
  }

  await prisma.$disconnect();
}

inspect().catch(console.error);
