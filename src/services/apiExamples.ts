// Exemplos de Uso da API Service

import {
  authService,
  quarteiraoService,
  faceService,
  imovelService,
  localidadeService,
} from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== AUTENTICAÇÃO =====

export async function handleRegister(cpf: string, password: string) {
  try {
    const response = await authService.register(cpf, password);
    console.log('Registro bem-sucedido:', response);

    // Salvar token para usar depois
    await AsyncStorage.setItem('authToken', response.token);
    await AsyncStorage.setItem('userId', response.userId.toString());

    return response;
  } catch (error) {
    console.error('Erro ao registrar:', error);
    throw error;
  }
}

export async function handleLogin(cpf: string, password: string) {
  try {
    const response = await authService.login(cpf, password);
    console.log('Login bem-sucedido:', response);

    // Salvar token para usar depois
    await AsyncStorage.setItem('authToken', response.token);
    await AsyncStorage.setItem('userId', response.userId.toString());

    return response;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

export async function handleLogout() {
  try {
    await authService.logout();
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
    console.log('Logout bem-sucedido');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}

export async function loadUserSession() {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      authService.setToken(token);
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        authService.setUserId(userId);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao carregar sessão:', error);
    return false;
  }
}

export async function getProfile() {
  try {
    const profile = await authService.getProfile();
    console.log('Perfil do usuário:', profile);
    return profile;
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    throw error;
  }
}

// ===== QUARTEIRÕES =====

export async function loadQuarteiroes() {
  try {
    const quarteiroes = await quarteiraoService.list();
    console.log('Quarteirões carregados:', quarteiroes);
    return quarteiroes;
  } catch (error) {
    console.error('Erro ao carregar quarteirões:', error);
    throw error;
  }
}

export async function createQuarteirao(data: {
  numero: number;
  nome: string;
  zona_id?: number;
  localidade_id?: number;
  area?: number;
  status?: string;
  descricao?: string;
}) {
  try {
    const response = await quarteiraoService.create(data);
    console.log('Quarteirao criado:', response);
    return response;
  } catch (error) {
    console.error('Erro ao criar quarteirao:', error);
    throw error;
  }
}

export async function updateQuarteirao(
  id: number,
  data: {
    numero?: number;
    nome?: string;
    zona_id?: number;
    localidade_id?: number;
    area?: number;
    status?: string;
    descricao?: string;
  }
) {
  try {
    const response = await quarteiraoService.update(id, data);
    console.log('Quarteirao atualizado:', response);
    return response;
  } catch (error) {
    console.error('Erro ao atualizar quarteirao:', error);
    throw error;
  }
}

export async function deleteQuarteirao(id: number) {
  try {
    const response = await quarteiraoService.delete(id);
    console.log('Quarteirao deletado:', response);
    return response;
  } catch (error) {
    console.error('Erro ao deletar quarteirao:', error);
    throw error;
  }
}

// ===== FACES =====

export async function loadFaces() {
  try {
    const faces = await faceService.list();
    console.log('Faces carregadas:', faces);
    return faces;
  } catch (error) {
    console.error('Erro ao carregar faces:', error);
    throw error;
  }
}

export async function createFace(data: {
  quarteirao_id: number;
  numero: number;
  lado_id?: number;
  descricao?: string;
}) {
  try {
    const response = await faceService.create(data);
    console.log('Face criada:', response);
    return response;
  } catch (error) {
    console.error('Erro ao criar face:', error);
    throw error;
  }
}

// ===== IMÓVEIS =====

export async function loadImoveis() {
  try {
    const imoveis = await imovelService.list();
    console.log('Imóveis carregados:', imoveis);
    return imoveis;
  } catch (error) {
    console.error('Erro ao carregar imóveis:', error);
    throw error;
  }
}

export async function createImovel(data: {
  face_id: number;
  numero: number;
  logradouro_id?: number;
  proprietario?: string;
  status?: string;
  descricao?: string;
}) {
  try {
    const response = await imovelService.create(data);
    console.log('Imóvel criado:', response);
    return response;
  } catch (error) {
    console.error('Erro ao criar imóvel:', error);
    throw error;
  }
}

// ===== LOCALIDADES =====

export async function loadLocalidades() {
  try {
    const localidades = await localidadeService.list();
    console.log('Localidades carregadas:', localidades);
    return localidades;
  } catch (error) {
    console.error('Erro ao carregar localidades:', error);
    throw error;
  }
}

export async function createLocalidade(data: {
  nome: string;
  descricao?: string;
}) {
  try {
    const response = await localidadeService.create(data);
    console.log('Localidade criada:', response);
    return response;
  } catch (error) {
    console.error('Erro ao criar localidade:', error);
    throw error;
  }
}
