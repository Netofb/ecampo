import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ecampo/auditoria-local';

export type AuditoriaLocal = {
  id: string;
  entidade: string;
  acao: 'create' | 'update' | 'delete';
  referencia?: string;
  resumo: string;
  createdAt: string;
};

export async function addAuditoriaLocal(entry: Omit<AuditoriaLocal, 'id' | 'createdAt'>) {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  let current: AuditoriaLocal[] = [];
  try { current = value ? JSON.parse(value) : []; } catch { current = []; }
  const record: AuditoriaLocal = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...current]));
  return record;
}

export async function listAuditoriaLocal() {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];
  try { return JSON.parse(value) as AuditoriaLocal[]; } catch { return []; }
}
