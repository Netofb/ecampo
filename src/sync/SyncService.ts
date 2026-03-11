import NetInfo from '@react-native-community/netinfo';
import { getDatabase } from '../storage/db';
import { quarteiraoLocalRepo } from '../repos/quarteiraoLocalRepo';
import { authService } from '../services/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:3333/api';

let syncInProgress = false;

export const SyncService = {
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  },

  async push(): Promise<{ success: number; conflicts: number; errors: number }> {
    const db = getDatabase();
    const pending = await new Promise<any[]>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM sync_outbox WHERE status IN ('pending', 'error') ORDER BY created_at LIMIT 50`,
          [],
          (_, { rows }) => {
            const result = [];
            for (let i = 0; i < rows.length; i++) {
              result.push(rows.item(i));
            }
            resolve(result);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });

    let success = 0, conflicts = 0, errors = 0;

    for (const op of pending) {
      try {
        const response = await fetch(`${API_BASE_URL}/sync/push`, {
          method: 'POST',
          headers: authService.getAuthHeaders(),
          body: JSON.stringify({
            op_id: op.op_id,
            entity: op.entity,
            op: op.op,
            server_id: op.server_id,
            base_version: op.base_version,
            payload: JSON.parse(op.payload)
          })
        });

        const result = await response.json();

        if (result.status === 'applied') {
          await new Promise<void>((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql('UPDATE sync_outbox SET status = ? WHERE op_id = ?', ['sent', op.op_id]);
              
              if (result.server_id) {
                tx.executeSql(
                  'UPDATE local_quarteiroes SET server_id = ?, version = ?, sync_status = ? WHERE local_id = ?',
                  [result.server_id, result.version, 'clean', op.local_id]
                );
              }
            }, reject, resolve);
          });
          success++;
        } else if (result.status === 'conflict') {
          await new Promise<void>((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql(
                'UPDATE sync_outbox SET status = ?, error_message = ? WHERE op_id = ?',
                ['conflict', result.message || 'Conflito detectado', op.op_id]
              );
            }, reject, resolve);
          });
          await quarteiraoLocalRepo.markConflict(op.local_id);
          conflicts++;
        } else {
          throw new Error(result.message || 'Erro desconhecido');
        }
      } catch (error: any) {
        await new Promise<void>((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              'UPDATE sync_outbox SET status = ?, error_message = ? WHERE op_id = ?',
              ['error', error.message, op.op_id]
            );
          }, reject, resolve);
        });
        errors++;
      }
    }

    return { success, conflicts, errors };
  },

  async pull(): Promise<number> {
    const db = getDatabase();
    const cursorRow = await new Promise<any>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT value FROM sync_meta WHERE key = ?',
          ['pull_cursor'],
          (_, { rows }) => resolve(rows.length > 0 ? rows.item(0) : null),
          (_, error) => { reject(error); return false; }
        );
      });
    });
    const cursor = cursorRow?.value || '0';

    const response = await fetch(`${API_BASE_URL}/sync/pull?since=${cursor}`, {
      headers: authService.getAuthHeaders()
    });

    const data = await response.json();
    let applied = 0;

    for (const change of data.changes || []) {
      if (change.op === 'delete') {
        await new Promise<void>((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql('DELETE FROM local_quarteiroes WHERE server_id = ?', [change.server_id]);
          }, reject, resolve);
        });
      } else {
        await quarteiraoLocalRepo.upsertFromServer(change.data);
      }
      applied++;
    }

    await new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        if (data.cursor) {
          tx.executeSql(
            'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
            ['pull_cursor', data.cursor]
          );
        }
        
        tx.executeSql(
          'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
          ['last_sync_at', new Date().toISOString()]
        );
      }, reject, resolve);
    });

    return applied;
  },

  async sync(): Promise<{ pushed: any; pulled: number }> {
    if (syncInProgress) throw new Error('Sincronização já em andamento');
    if (!(await this.isOnline())) throw new Error('Sem conexão com a internet');

    syncInProgress = true;
    try {
      const pushed = await this.push();
      const pulled = await this.pull();
      return { pushed, pulled };
    } finally {
      syncInProgress = false;
    }
  },

  async getSyncStatus() {
    const db = getDatabase();
    return new Promise<{ pending: number; conflicts: number; lastSync: string | null }>((resolve, reject) => {
      db.transaction(tx => {
        let pending = 0, conflicts = 0, lastSync = null;
        
        tx.executeSql(
          `SELECT COUNT(*) as count FROM sync_outbox WHERE status IN ('pending', 'error')`,
          [],
          (_, { rows }) => { pending = rows.item(0).count; }
        );
        
        tx.executeSql(
          `SELECT COUNT(*) as count FROM sync_outbox WHERE status = 'conflict'`,
          [],
          (_, { rows }) => { conflicts = rows.item(0).count; }
        );
        
        tx.executeSql(
          `SELECT value FROM sync_meta WHERE key = 'last_sync_at'`,
          [],
          (_, { rows }) => {
            lastSync = rows.length > 0 ? rows.item(0).value : null;
            resolve({ pending, conflicts, lastSync });
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }
};
