import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditoriaLocal } from './auditoriaLocal';

const STORAGE_KEY = '@ecampo/fotos-georreferenciadas';

export type FotoLocal = {
  id: string;
  uri: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  vinculoTipo: 'quarteirao' | 'face' | 'imovel' | 'geral';
  vinculoId?: string;
  observacao: string;
  createdAt: string;
  syncStatus: 'pending';
};

export async function listFotosLocais(): Promise<FotoLocal[]> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];
  try { return JSON.parse(value); } catch { return []; }
}

export async function addFotoLocal(data: Omit<FotoLocal, 'id' | 'createdAt' | 'syncStatus'>) {
  const fotos = await listFotosLocais();
  const foto: FotoLocal = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([foto, ...fotos]));
  await addAuditoriaLocal({ entidade: 'foto', acao: 'create', referencia: foto.id, resumo: `Foto em ${foto.latitude.toFixed(6)}, ${foto.longitude.toFixed(6)}` });
  return foto;
}
