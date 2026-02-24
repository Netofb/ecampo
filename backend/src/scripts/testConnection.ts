import db from '../database';

async function testConnection() {
  console.log('\n🔍 Testando conexão com banco de dados...\n');

  try {
    // Teste 1: Conexão
    await db.raw('SELECT 1');
    console.log('✅ Conexão com banco: OK');

    // Teste 2: Tabela usuarios
    const usuarios = await db('usuarios').count('* as count').first();
    console.log(`✅ Tabela usuarios: ${usuarios?.count} registros`);

    // Teste 3: Tabela tb_quarteiroes
    const quarteiroes = await db('tb_quarteiroes').count('* as count').first();
    console.log(`✅ Tabela tb_quarteiroes: ${quarteiroes?.count} registros`);

    // Teste 4: Tabela tb_localidades
    const localidades = await db('tb_localidades').count('* as count').first();
    console.log(`✅ Tabela tb_localidades: ${localidades?.count} registros`);

    // Teste 5: Tabela tb_zonas
    const zonas = await db('tb_zonas').count('* as count').first();
    console.log(`✅ Tabela tb_zonas: ${zonas?.count} registros`);

    // Teste 6: Verificar estrutura usuarios
    const userSample = await db('usuarios').first();
    if (userSample) {
      console.log('\n📋 Estrutura da tabela usuarios:');
      console.log('   - Campos:', Object.keys(userSample).join(', '));
      console.log('   - Tem senha_usuario?', 'senha_usuario' in userSample ? '✅ Sim' : '❌ Não');
    }

    console.log('\n✅ Todos os testes passaram!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro nos testes:', error.message);
    process.exit(1);
  }
}

testConnection();
