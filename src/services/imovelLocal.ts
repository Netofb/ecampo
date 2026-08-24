import AsyncStorage from '@react-native-async-storage/async-storage';
import { addAuditoriaLocal } from './auditoriaLocal';

const STORAGE_KEY = '@ecampo/imoveis-locais';

export type ImovelLocal = {
  id_imovel: string;
  id_face: number;
  seq1: number;
  nome_logradouro: string;
  numero: string;
  seq: string;
  tipo: string;
  status: 'Ativo' | 'Inativo';
  createdAt: string;
  syncStatus: 'pending';
};

export async function listImoveisLocais(): Promise<ImovelLocal[]> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];
  try { return JSON.parse(value); } catch { return []; }
}

export async function addImovelLocal(data: Omit<ImovelLocal, 'id_imovel' | 'createdAt' | 'syncStatus'>) {
  const current = await listImoveisLocais();
  const imovel: ImovelLocal = {
    ...data,
    id_imovel: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([imovel, ...current]));
  await addAuditoriaLocal({ entidade: 'imovel', acao: 'create', referencia: imovel.id_imovel, resumo: `Imóvel ${imovel.numero || 'sem número'} pendente` });
  return imovel;
}
