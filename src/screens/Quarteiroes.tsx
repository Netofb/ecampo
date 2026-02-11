import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { quarteiraoService } from '../services/api';

const Quarteiroes: React.FC = () => {
  const [quarteiroes, setQuarteiroes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuarteiroes();
  }, []);

  const loadQuarteiroes = async () => {
    try {
      const data = await quarteiraoService.list();
      console.log('Quarteirões carregados:', data);
      setQuarteiroes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar quarteirões:', error);
      Alert.alert('Erro', 'Não foi possível carregar os quarteirões');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quarteiroes}
        keyExtractor={(item, index) => item?.id_quadra?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item?.nome_quadra || 'Sem nome'}</Text>
            <Text style={styles.cardSubtitle}>Número: {item?.numero_quadra || 'N/A'}</Text>
            <Text style={styles.cardStatus}>Status: {item?.status || 'N/A'}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum quarteirão cadastrado</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cardStatus: {
    fontSize: 14,
    color: '#4CAF50',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
});

export default Quarteiroes;
