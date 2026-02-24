import db from '../database';

async function listTables() {
  try {
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📊 Tabelas do banco de dados:\n');
    tables.rows.forEach((row: any, index: number) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    console.log('\n✅ Total:', tables.rows.length, 'tabelas\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

listTables();
