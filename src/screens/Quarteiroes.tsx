import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { quarteiraoService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const Quarteiroes: React.FC = () => {
  const { colors, isDark } = useTheme();
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={quarteiroes}
        keyExtractor={(item, index) => item?.id_quadra?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item?.nome_quadra || 'Sem nome'}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Número: {item?.numero_quadra || 'N/A'}</Text>
            <Text style={[styles.cardStatus, { color: colors.success }]}>Status: {item?.status || 'N/A'}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum quarteirão cadastrado</Text>
        }
      />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
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
    marginBottom: 2,
  },
  cardStatus: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});

export default Quarteiroes;
