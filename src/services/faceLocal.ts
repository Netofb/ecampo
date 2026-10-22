import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditoriaLocal } from './auditoriaLocal';

const STORAGE_KEY = '@ecampo/faces-locais';

export type FaceLocal = {
  id_face: string;
  id_quarteirao: number;
  numero_face: number;
  nome_linha: string;
  status: 'Ativo' | 'Inativo';
  linha_geojson?: object | null;
  cor_linha?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  syncStatus: 'pending';
};

export async function listFacesLocais(): Promise<FaceLocal[]> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];
  try { return JSON.parse(value); } catch { return []; }
}

export async function addFaceLocal(data: Omit<FaceLocal, 'id_face' | 'createdAt' | 'syncStatus'>) {
  const current = await listFacesLocais();
  const face: FaceLocal = {
    ...data,
    id_face: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([face, ...current]));
  await addAuditoriaLocal({ entidade: 'face', acao: 'create', referencia: face.id_face, resumo: `Face ${face.numero_face} pendente` });
  return face;
}

export async function updateFaceLocal(id: string, data: Omit<FaceLocal, 'id_face' | 'createdAt' | 'syncStatus'>) {
  const current = await listFacesLocais();
  const existing = current.find(face => face.id_face === id);
  if (!existing) throw new Error('Face local não encontrada');
  const updated = { ...existing, ...data, syncStatus: 'pending' as const };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current.map(face => face.id_face === id ? updated : face)));
  await addAuditoriaLocal({ entidade: 'face', acao: 'update', referencia: id, resumo: `Face ${updated.numero_face} atualizada localmente` });
  return updated;
}
