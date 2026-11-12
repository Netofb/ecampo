import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { SyncService } from '../sync/SyncService';
import { openDatabase } from '../storage/db';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const SyncInitialScreen: React.FC = () => {
  const { colors } = useTheme();
  const { completeSync } = useAuth();
  const [online, setOnline] = useState(false);
  const [progress, setProgress] = useState('Verificando conexão com a internet...');
  const [error, setError] = useState('');
  const syncRunning = useRef(false);
  const mounted = useRef(true);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSync = useCallback(async () => {
    if (syncRunning.current) return;
    syncRunning.current = true;
    let network: NetInfoState;
    try {
      network = await NetInfo.fetch();
    } catch {
      syncRunning.current = false;
      if (mounted.current) {
        setOnline(false);
        setProgress('Aguardando conexão com a internet...');
      }
      return;
    }
    const hasInternet = network.isConnected === true && network.isInternetReachable !== false;
    if (!hasInternet) {
      syncRunning.current = false;
      if (mounted.current) {
        setOnline(false);
        setProgress('Aguardando conexão com a internet...');
      }
      return;
    }

    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    setOnline(true);
    setError('');
    try {
      setProgress('Preparando os dados locais...');
      await openDatabase();

      setProgress('Baixando dados do servidor. Mantenha o aparelho conectado à rede...');
      await SyncService.sync();
      if (mounted.current) completeSync();
    } catch (error: any) {
      if (mounted.current) {
        setError(error?.message || 'Não foi possível baixar os dados.');
        setProgress('A sincronização será tentada novamente automaticamente.');
        retryTimer.current = setTimeout(() => {
          retryTimer.current = null;
          runSync();
        }, 15000);
      }
    } finally {
      syncRunning.current = false;
    }
  }, [completeSync]);

  useEffect(() => {
    mounted.current = true;
    const hasInternet = (state: NetInfoState) => state.isConnected === true && state.isInternetReachable !== false;
    const handleNetworkChange = (state: NetInfoState) => {
      const connected = hasInternet(state);
      setOnline(connected);
      if (connected) runSync();
      else setProgress('Aguardando conexão com a internet...');
    };

    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    NetInfo.fetch().then(handleNetworkChange).catch(() => {
      setOnline(false);
      setProgress('Aguardando conexão com a internet...');
    });
    return () => {
      mounted.current = false;
      unsubscribe();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [runSync]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name={online ? 'cloud-download-outline' : 'cloud-offline-outline'} size={80} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>{online ? 'Baixando dados' : 'Conecte-se à rede'}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {online
          ? 'O aplicativo está atualizando os dados automaticamente. Mantenha a conexão com a internet até terminar.'
          : 'O aplicativo começará a baixar os dados assim que detectar uma conexão com a internet.'}
      </Text>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.progress, { color: colors.textSecondary }]}>{error || progress}</Text>
        {!!error && <Text style={[styles.retry, { color: colors.textSecondary }]}>O aplicativo continuará tentando automaticamente. Mantenha a conexão ativa.</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  progress: {
    marginTop: 16,
    fontSize: 14,
  },
  retry: {
    marginTop: 12,
    textAlign: 'center',
  },
});

export default SyncInitialScreen;
