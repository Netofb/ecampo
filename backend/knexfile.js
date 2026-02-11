const path = require('path');

const config = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      password: 'fabio99248033',
      database: 'ecampo',
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      extension: 'js',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      extension: 'js',
    },
  },
};

module.exports = config;
