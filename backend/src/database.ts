import knex from 'knex';
import path from 'path';

const db = knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'fabio99248033',
    database: 'ecampo',
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: path.join(__dirname, '../migrations'),
    extension: 'ts',
  },
  seeds: {
    directory: path.join(__dirname, '../seeds'),
    extension: 'ts',
  },
});

export default db;
