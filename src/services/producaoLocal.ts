import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditoriaLocal } from './auditoriaLocal';

const STORAGE_KEY = '@ecampo/producao-local';

export type ProducaoLocal = {
  id: string;
  quarteiraoId: number;
  quarteiraoNome: string;
  cultura: string;
  safra: string;
  areaPlantada: string;
  quantidade: string;
  valor: string;
  createdAt: string;
  syncStatus: 'pending';
};

export async function listProducaoLocal(): Promise<ProducaoLocal[]> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export async function addProducaoLocal(entry: Omit<ProducaoLocal, 'id' | 'createdAt' | 'syncStatus'>) {
  const current = await listProducaoLocal();
  const record: ProducaoLocal = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...current]));
  await addAuditoriaLocal({ entidade: 'producao', acao: 'create', referencia: record.id, resumo: `Produção de ${record.cultura} no ${record.quarteiraoNome}` });
  return record;
}
