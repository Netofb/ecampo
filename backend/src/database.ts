import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const useSSL = process.env.DB_SSL === 'true';

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'ecampo',
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    };

const db = knex({
  client: 'pg',
  connection: connectionConfig,
  pool: {
    min: 1,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,   // descarta conexão ociosa após 10 min
    reapIntervalMillis: 1000,    // verifica conexões mortas a cada 1s
    createRetryIntervalMillis: 200,
  },
});

// Valida conexão na inicialização e loga erros de pool
db.raw('SELECT 1')
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch((err: Error) => console.error('❌ Falha na conexão inicial com PostgreSQL:', err.message));

export default db;
