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
    min: 0,
    max: 5,
    acquireTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
});

// Valida conexão na inicialização e loga erros de pool
db.raw('SELECT 1')
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch((err: Error) => console.error('❌ Falha na conexão inicial com PostgreSQL:', err.message));

export default db;
