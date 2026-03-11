import * as SQLite from 'expo-sqlite';

const DB_NAME = 'ecampo.db';

let db: SQLite.SQLiteDatabase | null = null;

export const openDatabase = async () => {
  if (db) return db;
  
  db = SQLite.openDatabase(DB_NAME);
  await runMigrations(db);
  return db;
};

export const getDatabase = () => {
  if (!db) throw new Error('Database not initialized. Call openDatabase first.');
  return db;
};

const runMigrations = async (database: SQLite.SQLiteDatabase) => {
  return new Promise<void>((resolve, reject) => {
    database.transaction(
      tx => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS local_quarteiroes (
            local_id TEXT PRIMARY KEY,
            server_id INTEGER,
            version INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL,
            data TEXT NOT NULL,
            sync_status TEXT NOT NULL DEFAULT 'clean'
          );
        `);
        
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS sync_outbox (
            op_id TEXT PRIMARY KEY,
            entity TEXT NOT NULL,
            op TEXT NOT NULL,
            local_id TEXT NOT NULL,
            server_id INTEGER,
            base_version INTEGER DEFAULT 0,
            payload TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            error_message TEXT,
            created_at TEXT NOT NULL
          );
        `);
        
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS sync_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );
        `);
        
        tx.executeSql(`CREATE INDEX IF NOT EXISTS idx_outbox_status ON sync_outbox(status);`);
        tx.executeSql(`CREATE INDEX IF NOT EXISTS idx_quarteiroes_server_id ON local_quarteiroes(server_id);`);
      },
      error => reject(error),
      () => resolve()
    );
  });
};

export const resetDatabase = async () => {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    database.transaction(
      tx => {
        tx.executeSql('DELETE FROM local_quarteiroes');
        tx.executeSql('DELETE FROM sync_outbox');
        tx.executeSql('DELETE FROM sync_meta');
      },
      error => reject(error),
      () => resolve()
    );
  });
};
