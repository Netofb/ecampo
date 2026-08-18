import { getDatabase } from '../storage/db';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface LocalQuarteirao {
  local_id: string;
  server_id?: number;
  version: number;
  updated_at: string;
  data: any;
  sync_status: 'clean' | 'dirty' | 'conflict';
}

export const quarteiraoLocalRepo = {
  async list(): Promise<LocalQuarteirao[]> {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM local_quarteiroes ORDER BY updated_at DESC',
          [],
          (_, { rows }) => {
            const result = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              result.push({ ...row, data: JSON.parse(row.data) });
            }
            resolve(result);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  },

  async getById(localId: string): Promise<LocalQuarteirao | null> {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM local_quarteiroes WHERE local_id = ?',
          [localId],
          (_, { rows }) => {
            if (rows.length === 0) {
              resolve(null);
            } else {
              const row = rows.item(0);
              resolve({ ...row, data: JSON.parse(row.data) });
            }
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  },

  async upsertFromServer(serverData: any) {
    const db = getDatabase();
    const localId = generateUUID();
    const now = new Date().toISOString();
    
    return new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT local_id FROM local_quarteiroes WHERE server_id = ?',
          [serverData.id_quadra],
          (_, { rows }) => {
            const existingId = rows.length > 0 ? rows.item(0).local_id : localId;
            tx.executeSql(
              `INSERT OR REPLACE INTO local_quarteiroes (local_id, server_id, version, updated_at, data, sync_status)
               VALUES (?, ?, ?, ?, ?, 'clean')`,
              [existingId, serverData.id_quadra, serverData.version || 0, now, JSON.stringify(serverData)]
            );
          }
        );
      }, reject, resolve);
    });
  },

  async createLocal(data: any): Promise<string> {
    const db = getDatabase();
    const localId = generateUUID();
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO local_quarteiroes (local_id, version, updated_at, data, sync_status) VALUES (?, 0, ?, ?, ?)',
          [localId, now, JSON.stringify(data), 'dirty']
        );
        
        tx.executeSql(
          `INSERT INTO sync_outbox (op_id, entity, op, local_id, payload, created_at)
           VALUES (?, 'quarteirao', 'create', ?, ?, ?)`,
          [generateUUID(), localId, JSON.stringify(data), now]
        );
      }, reject, () => resolve(localId));
    });
  },

  async updateLocal(localId: string, data: any) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const existing = await this.getById(localId);
    
    if (!existing) throw new Error('Quarteirão não encontrado');
    
    return new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE local_quarteiroes SET data = ?, updated_at = ?, sync_status = ? WHERE local_id = ?',
          [JSON.stringify(data), now, 'dirty', localId]
        );
        
        tx.executeSql(
          `INSERT INTO sync_outbox (op_id, entity, op, local_id, server_id, base_version, payload, created_at)
           VALUES (?, 'quarteirao', 'update', ?, ?, ?, ?, ?)`,
          [generateUUID(), localId, existing.server_id ?? null, existing.version, JSON.stringify(data), now]
        );
      }, reject, resolve);
    });
  },

  async deleteLocal(localId: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const existing = await this.getById(localId);
    
    if (!existing) throw new Error('Quarteirão não encontrado');
    
    return new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql('DELETE FROM local_quarteiroes WHERE local_id = ?', [localId]);
        
        if (existing.server_id) {
          tx.executeSql(
            `INSERT INTO sync_outbox (op_id, entity, op, local_id, server_id, base_version, payload, created_at)
             VALUES (?, 'quarteirao', 'delete', ?, ?, ?, '{}', ?)`,
            [generateUUID(), localId, existing.server_id, existing.version, now]
          );
        }
      }, reject, resolve);
    });
  },

  async markConflict(localId: string) {
    const db = getDatabase();
    return new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql('UPDATE local_quarteiroes SET sync_status = ? WHERE local_id = ?', ['conflict', localId]);
      }, reject, resolve);
    });
  }
};
