
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://ecampo.onrender.com/api';

export const getApiUrlForDisplay = () => API_BASE_URL;

class AuthService {
  private token: string | null = null;
  private userId: string | null = null;
  private userIbge: string | null = null;
  private refreshInFlight: Promise<boolean> | null = null;

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  setUserIbge(ibge: string) {
    this.userIbge = ibge;
  }

  getUserIbge(): string | null {
    return this.userIbge;
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: this.token ? `Bearer ${this.token}` : '',
    };
  }

  async login(cpf: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      this.token = data.token;
      this.userId = data.userId.toString();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async refreshSession(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = (async () => {
      const savedLogin = await SecureStore.getItemAsync('ecampo:last-login');
      if (!savedLogin) return false;

      let credentials: { cpf?: string; password?: string };
      try {
        credentials = JSON.parse(savedLogin);
      } catch {
        return false;
      }
      if (!credentials.cpf || !credentials.password) return false;

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (response.status === 401 || response.status === 400) return false;
      if (!response.ok) throw new Error(`Não foi possível renovar a sessão (${response.status})`);

      const data = await response.json();
      const userId = String(data.user?.id ?? data.userId ?? '');
      if (!data.token || !userId) return false;

      const firstName = data.user?.name ? String(data.user.name).split(' ')[0] : '';
      const ibge = String(data.user?.ibge || '');
      const photo = String(data.user?.link_foto || '');
      this.token = data.token;
      this.userId = userId;
      this.userIbge = ibge;
      await AsyncStorage.multiSet([
        ['authToken', data.token],
        ['userId', userId],
        ['userCPF', credentials.cpf],
        ['userIbge', ibge],
        ['userName', firstName],
        ['userPhoto', photo],
      ]);
      return true;
    })();

    try {
      return await this.refreshInFlight;
    } finally {
      this.refreshInFlight = null;
    }
  }

  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get profile');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    this.token = null;
    this.userId = null;
    this.userIbge = null;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

class QuarteiraoService {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async list() {
    try {
      const response = await fetch(`${API_BASE_URL}/quarteiroes`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Quarteirões (${response.status}): ${details || 'resposta inválida do servidor'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Quarteirão list error:', error);
      throw error;
    }
  }

  async map() {
    const response = await fetch(`${API_BASE_URL}/quarteiroes/map`, {
      method: 'GET',
      headers: this.authService.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quarteirões map');
    }

    return await response.json();
  }

  async create(data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/quarteiroes`, {
        method: 'POST',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create quarteirao');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/quarteiroes/${id}`, {
        method: 'PUT',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update quarteirao');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/quarteiroes/${id}`, {
        method: 'DELETE',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete quarteirao');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

class FaceService {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async list() {
    try {
      const response = await fetch(`${API_BASE_URL}/faces`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch faces');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async create(data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/faces`, {
        method: 'POST',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create face');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/faces/${id}`, {
        method: 'PUT',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update face');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/faces/${id}`, {
        method: 'DELETE',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete face');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getMap() {
    try {
      const response = await fetch(`${API_BASE_URL}/faces/map`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Faces map error response:', errorText);
        throw new Error(`Failed to fetch faces map: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Faces map fetch error:', error);
      throw error;
    }
  }
}

class ImovelService {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async list() {
    try {
      const response = await fetch(`${API_BASE_URL}/imoveis`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch imoveis');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async create(data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/imoveis`, {
        method: 'POST',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create imovel');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/imoveis/${id}`, {
        method: 'PUT',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update imovel');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/imoveis/${id}`, {
        method: 'DELETE',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete imovel');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async listFacesByQuarteirao(quarteiraoId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/faces`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch faces');
      }

      const faces = await response.json();
      return faces.filter((f: any) => f.id_quarteirao === quarteiraoId);
    } catch (error) {
      throw error;
    }
  }
}

class LocalidadeService {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async list() {
    try {
      const response = await fetch(`${API_BASE_URL}/localidades`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch localidades');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async create(data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/localidades`, {
        method: 'POST',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create localidade');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

class ZonaService {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async list() {
    try {
      const response = await fetch(`${API_BASE_URL}/localidades/zonas`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch zonas');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

class ProducaoService {
  async getOpcoes() {
    const request = () => fetch(`${API_BASE_URL}/producao/opcoes`, {
      method: 'GET',
      headers: authService.getAuthHeaders(),
    });
    let response = await request();
    if (response.status === 401 && await authService.refreshSession()) response = await request();

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('O servidor ainda não tem a rota de opções de produção. Publique a atualização do backend e tente novamente.');
      }
      let detail = '';
      try {
        const body = await response.json();
        detail = body.error || body.message || '';
      } catch {
        // Resposta sem JSON: mantém o status HTTP para diagnóstico.
      }
      throw new Error(`Não foi possível carregar as opções de produção (${response.status})${detail ? `: ${detail}` : ''}`);
    }

    const options = await response.json();
    const rawActivities = Array.isArray(options)
      ? options
      : options?.atividades ?? options?.activities ?? options?.data?.atividades ?? [];
    const atividades = Array.isArray(rawActivities)
      ? rawActivities.map((activity: any, index: number) => {
          if (typeof activity === 'string') {
            return { id_atividade: activity, nome_atividade: activity };
          }
          const nome = activity?.nome_atividade ?? activity?.nome ?? activity?.atividade ?? activity?.label;
          if (!nome) return null;
          return {
            ...activity,
            id_atividade: activity.id_atividade ?? activity.co_atividade ?? activity.id ?? index,
            nome_atividade: String(nome),
          };
        }).filter(Boolean)
      : [];
    return {
      ...(Array.isArray(options) ? {} : options),
      atividades,
    };
  }
}

// Initialize services
const authService = new AuthService();
const quarteiraoService = new QuarteiraoService(authService);
const faceService = new FaceService(authService);
const imovelService = new ImovelService(authService);
const localidadeService = new LocalidadeService(authService);
const zonaService = new ZonaService(authService);
const producaoService = new ProducaoService();

export {
  authService,
  quarteiraoService,
  faceService,
  imovelService,
  localidadeService,
  zonaService,
  producaoService,
};
