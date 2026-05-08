import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SyncService } from '../sync/SyncService';
import { openDatabase } from '../storage/db';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const SyncInitialScreen: React.FC = () => {
  const { colors } = useTheme();
  const { completeSync } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleSync = async () => {
    setLoading(true);
    try {
      setProgress('Inicializando banco local...');
      await openDatabase();
      
      setProgress('Baixando dados do servidor...');
      const pulled = await SyncService.pull();
      
      setProgress(`${pulled} registros baixados!`);
      
      setTimeout(() => {
        completeSync();
      }, 1000);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha na sincronização inicial');
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="sync-outline" size={80} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>Sincronização</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Baixe os dados mais recentes do servidor para começar a usar o app offline.
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.progress, { color: colors.textSecondary }]}>{progress}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSync}
        >
          <Text style={styles.buttonText}>Baixar Dados</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => completeSync()}
        disabled={loading}
      >
        <Text style={[styles.skipText, { color: colors.primary }]}>Pular Sincronização
          
        </Text>
        
      </TouchableOpacity>
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
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  progress: {
    marginTop: 16,
    fontSize: 14,
  },
  skipButton: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default SyncInitialScreen;
