import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { openDatabase } from '../storage/db';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'needs_sync';

interface User {
  id: string;
  cpf: string;
  name: string;
  ibge?: string;
  photo?: string;
}

interface AuthContextData {
  status: AuthStatus;
  loading: boolean;
  user: User | null;
  token: string | null;
  login: (cpf: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeSync: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const bootstrap = async () => {
    try {
      await openDatabase();
      
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUserCPF = await AsyncStorage.getItem('userCPF');
      const storedUserName = await AsyncStorage.getItem('userName');
      const storedUserIbge = await AsyncStorage.getItem('userIbge');
      const storedUserPhoto = await AsyncStorage.getItem('userPhoto');

      if (storedToken && storedUserId) {
        authService.setToken(storedToken);
        authService.setUserId(storedUserId);
        if (storedUserIbge) {
          authService.setUserIbge(storedUserIbge);
        }

        setToken(storedToken);
        setUser({
          id: storedUserId,
          cpf: storedUserCPF || '',
          name: storedUserName || '',
          ibge: storedUserIbge || '',
          photo: storedUserPhoto || '',
        });
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Bootstrap error:', error);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const login = async (cpf: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login(cpf, password);
      const firstName = response.user.name ? response.user.name.split(' ')[0] : '';

      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('userId', String(response.user.id));
      await AsyncStorage.setItem('userCPF', cpf);
      await AsyncStorage.setItem('userIbge', response.user.ibge || '');
      await AsyncStorage.setItem('userName', firstName);
      await AsyncStorage.setItem('userPhoto', response.user.link_foto || '');

      authService.setToken(response.token);
      authService.setUserId(String(response.user.id));
      if (response.user.ibge) {
        authService.setUserIbge(response.user.ibge);
      }

      setToken(response.token);
      setUser({
        id: String(response.user.id),
        cpf,
        name: firstName,
        ibge: response.user.ibge || '',
        photo: response.user.link_foto || '',
      });
      setStatus('needs_sync');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.multiRemove([
        'authToken',
        'userId',
        'userCPF',
        'userIbge',
        'userName',
        'userPhoto',
      ]);
      await authService.logout();
      setToken(null);
      setUser(null);
      setStatus('unauthenticated');
    } finally {
      setLoading(false);
    }
  };

  const completeSync = () => {
    setStatus('authenticated');
  };

  return (
    <AuthContext.Provider value={{ status, loading, user, token, login, logout, completeSync }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
