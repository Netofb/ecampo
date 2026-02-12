import db from './backend/src/database';

async function checkLocalidades() {
  try {
    // Verificar estrutura da tabela
    console.log('\n=== ESTRUTURA DA TABELA tb_localidades ===');
    const structure = await db.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tb_localidades' 
      ORDER BY ordinal_position
    `);
    console.table(structure.rows);
    
    // Verificar dados da Suzana (id_usuario = 2)
    console.log('\n=== LOCALIDADES DA SUZANA (id_usuario = 2) ===');
    const localidades = await db('tb_localidades')
      .where('id_usuario', 2)
      .orderBy('nome_localidade')
      .limit(10);
    console.table(localidades);
    
    // Verificar zonas da Suzana
    console.log('\n=== ZONAS DA SUZANA (id_usuario = 2) ===');
    const zonas = await db('tb_zonas')
      .where('id_usuario', 2)
      .orderBy('nome_zona')
      .limit(10);
    console.table(zonas);
    
    process.exit(0);
  } catch (error: any) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

checkLocalidades();
