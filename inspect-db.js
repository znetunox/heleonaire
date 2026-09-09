const prisma = require('./packages/server/node_modules/@prisma/client')

const client = new prisma.default({
  datasourceUrl: 'file:C:\\Users\\leona\\OneDrive\\Área de Trabalho\\Heleonaire\\packages\\server\\prisma\\dev.db'
})

async function inspectDatabase() {
  try {
    console.log('\n=== TABELAS NO BANCO ===')
    const tables = await client.$queryRaw`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name;
    `
    console.log('Tabelas:', tables.join(', '))

    console.log('\n=== _PRISMA_MIGRATIONS ===')
    const migrations = await client.$queryRaw`
      SELECT * FROM _prisma_migrations;
    `
    console.log('Migrations registradas:', migrations.length)
    if (migrations.length > 0) {
      migrations.forEach(m => {
        console.log(`  - ${m.migration_name}: ${m.execution_status}`)
      })
    }

    console.log('\n=== COLUNAS DA TABELA Character ===')
    const characterColumns = await client.$queryRaw`
      PRAGMA table_info(Character);
    `
    console.log('Colunas:', characterColumns.map(c => c.name).join(', '))

    const hasAvailablePoints = characterColumns.find(c => c.name === 'availablePoints')
    console.log('\navailablePoints existe:', !!hasAvailablePoints)

    console.log('\n=== CARACTERES ===')
    const count = await client.character.count()
    console.log('Total de personagens:', count)

  } catch (error) {
    console.error('Erro:', error.message)
  } finally {
    await client.$disconnect()
  }
}

inspectDatabase()
