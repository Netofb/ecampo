// API Service - Replaces Supabase
import { Platform } from 'react-native';

// URL da API com fallback para desenvolvimento
// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.126:3333/api';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.17:3333/api';
// Exportar para uso em telas de debug
export const getApiUrlForDisplay = () => API_BASE_URL;

class AuthService {
  private token: string | null = null;
  private userId: string | null = null;
  private userIbge: string | null = null;

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

  async register(cpf: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      this.token = data.token;
      this.userId = data.userId.toString();
      return data;
    } catch (error) {
      throw error;
    }
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
        throw new Error('Failed to fetch quarteirões');
      }

      return await response.json();
    } catch (error) {
      console.error('Quarteirão list error:', error);
      throw error;
    }
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

// Initialize services
const authService = new AuthService();
const quarteiraoService = new QuarteiraoService(authService);
const faceService = new FaceService(authService);
const imovelService = new ImovelService(authService);
const localidadeService = new LocalidadeService(authService);
const zonaService = new ZonaService(authService);

export {
  authService,
  quarteiraoService,
  faceService,
  imovelService,
  localidadeService,
  zonaService,
};
