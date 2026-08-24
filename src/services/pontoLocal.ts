import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditoriaLocal } from './auditoriaLocal';

const STORAGE_KEY = '@ecampo/pontos-referencia';

export type PontoLocal = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  descricao: string;
  createdAt: string;
  syncStatus: 'pending';
};

export async function listPontosLocais(): Promise<PontoLocal[]> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];
  try { return JSON.parse(value); } catch { return []; }
}

export async function addPontoLocal(data: Omit<PontoLocal, 'id' | 'createdAt' | 'syncStatus'>) {
  const pontos = await listPontosLocais();
  const ponto: PontoLocal = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([ponto, ...pontos]));
  await addAuditoriaLocal({ entidade: 'ponto_referencia', acao: 'create', referencia: ponto.id, resumo: ponto.descricao || `Ponto em ${ponto.latitude.toFixed(6)}, ${ponto.longitude.toFixed(6)}` });
  return ponto;
}
