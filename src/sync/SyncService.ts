import NetInfo from '@react-native-community/netinfo';
import { getDatabase } from '../storage/db';
import { quarteiraoLocalRepo } from '../repos/quarteiraoLocalRepo';
import { authService, getApiUrlForDisplay } from '../services/api';
import { listProducaoLocal, updateProducaoLocalSync } from '../services/producaoLocal';
import { listFacesLocais, updateFaceLocalSync } from '../services/faceLocal';

// Mantém a sincronização na mesma API configurada para os demais serviços,
// inclusive quando a variável de ambiente não foi definida.
const API_BASE_URL = getApiUrlForDisplay();

let syncInProgress = false;

class SyncAuthenticationError extends Error {
  constructor() {
    super('Sua sessão expirou ou não é mais válida. Entre novamente para baixar as alterações.');
    this.name = 'SyncAuthenticationError';
  }
}

const fetchWithSession = async (url: string, init: RequestInit = {}) => {
  const request = () => fetch(url, { ...init, headers: authService.getAuthHeaders() });
  const response = await request();
  if (response.status !== 401) return response;

  if (!(await authService.refreshSession())) throw new SyncAuthenticationError();
  const retryResponse = await request();
  if (retryResponse.status === 401) throw new SyncAuthenticationError();
  return retryResponse;
};

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
        const response = await fetchWithSession(`${API_BASE_URL}/sync/push`, {
          method: 'POST',
          body: JSON.stringify({
            op_id: op.op_id,
            entity: op.entity,
            op: op.op,
            server_id: op.server_id,
            base_version: op.base_version,
            payload: JSON.parse(op.payload)
          })
        });

        if (!response.ok) {
          throw new Error(`Falha ao enviar alteração (${response.status})`);
        }

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
        if (error?.name === 'SyncAuthenticationError') throw error;
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

    const pendingFaces = (await listFacesLocais()).filter(face => face.syncStatus === 'pending' || face.syncStatus === 'error');
    for (const face of pendingFaces) {
      try {
        const response = await fetchWithSession(`${API_BASE_URL}/sync/push`, {
          method: 'POST',
          body: JSON.stringify({
            op_id: `face-${face.id_face}`,
            entity: 'face',
            op: face.serverId ? 'update' : 'create',
            server_id: face.serverId ?? null,
            payload: {
              numero_face: face.numero_face,
              id_quarteirao: face.id_quarteirao,
              nome_linha: face.nome_linha,
              status: face.status,
              linha_geojson: face.linha_geojson,
              cor_linha: face.cor_linha,
              latitude: face.latitude,
              longitude: face.longitude,
            },
          }),
        });
        if (!response.ok) {
          let message = `Falha ao enviar face (${response.status})`;
          try {
            const result = await response.json();
            message = result.message || result.error || message;
          } catch {}
          throw new Error(message);
        }
        const result = await response.json();
        if (result.status !== 'applied') throw new Error(result.message || 'O servidor não confirmou o envio da face.');
        await updateFaceLocalSync(face.id_face, { syncStatus: 'synced', syncError: undefined, serverId: result.server_id ?? face.serverId });
        success++;
      } catch (error: any) {
        if (error?.name === 'SyncAuthenticationError') throw error;
        await updateFaceLocalSync(face.id_face, { syncStatus: 'error', syncError: error?.message || 'Falha ao enviar face.' });
        errors++;
      }
    }

    const pendingProductions = (await listProducaoLocal()).filter(entry => entry.syncStatus === 'pending' || entry.syncStatus === 'error');
    for (const entry of pendingProductions) {
      try {
        const payload = entry.payload || {
          id_quarteirao: entry.quarteiraoId,
          atividade: entry.cultura,
          data_atividade: entry.createdAt.slice(0, 10),
          ciclo_ano: entry.safra,
        };
        const response = await fetchWithSession(`${API_BASE_URL}/sync/push`, {
          method: 'POST',
          body: JSON.stringify({
            op_id: `producao-${entry.id}`,
            entity: 'producao',
            op: 'create',
            payload,
          }),
        });
        if (!response.ok) {
          let message = `Falha ao enviar atividade (${response.status})`;
          try {
            const result = await response.json();
            message = result.message || result.error || message;
          } catch {}
          throw new Error(message);
        }
        const result = await response.json();
        if (result.status !== 'applied') throw new Error(result.message || 'O servidor não confirmou o envio da atividade.');
        await updateProducaoLocalSync(entry.id, { syncStatus: 'synced', syncError: undefined, serverId: result.server_id });
        success++;
      } catch (error: any) {
        if (error?.name === 'SyncAuthenticationError') throw error;
        await updateProducaoLocalSync(entry.id, { syncStatus: 'error', syncError: error?.message || 'Falha ao enviar atividade.' });
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
    let cursor = cursorRow?.value || '0';
    let applied = 0;

    while (true) {
      const response = await fetchWithSession(`${API_BASE_URL}/sync/pull?since=${encodeURIComponent(cursor)}`);

      if (!response.ok) {
        let message = `Falha ao baixar alterações (${response.status})`;
        try {
          const error = await response.json();
          if (error.error || error.message) {
            message += `: ${error.error || error.message}`;
          }
        } catch {
          // Mantém a mensagem com o status quando a resposta não é JSON.
        }
        throw new Error(message);
      }

      const data = await response.json();
      const changes = data.changes || [];
      for (const change of changes) {
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

      const nextCursor = data.cursor || cursor;
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql('INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)', ['pull_cursor', nextCursor]);
          tx.executeSql('INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)', ['last_sync_at', new Date().toISOString()]);
        }, reject, resolve);
      });

      if (changes.length < 100 || String(nextCursor) === String(cursor)) break;
      cursor = String(nextCursor);
    }

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
    const [faces, producoes] = await Promise.all([
      listFacesLocais(),
      listProducaoLocal(),
    ]);
    const localPending = faces.filter(face => face.syncStatus === 'pending' || face.syncStatus === 'error').length +
      producoes.filter(entry => entry.syncStatus === 'pending' || entry.syncStatus === 'error').length;
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
            resolve({ pending: pending + localPending, conflicts, lastSync });
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }
};
