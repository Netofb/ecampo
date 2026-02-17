import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { openStreetView } from '../../utils/streetView';
import { authService } from '../../services/api';

interface QuarteiraoMapItem {
  id: number;
  nome: string;
  numero: number;
  latitude: number;
  longitude: number;
  color: string;
}

const MapaScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quarteiroes, setQuarteiroes] = useState<QuarteiraoMapItem[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [opcoesItensPorPagina] = useState([5, 10, 20, 50]);

  useEffect(() => {
    loadQuarteiroes();
  }, []);

  const totalItens = quarteiroes.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  
  useEffect(() => {
    if (paginaAtual > totalPaginas && totalPaginas > 0) {
      setPaginaAtual(totalPaginas);
    }
  }, [totalItens, itensPorPagina]);

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const quarteiroesPagina = quarteiroes.slice(inicio, fim);

  const loadQuarteiroes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.1.15:3333/api/quarteiroes/map', {
        headers: authService.getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Erro ao carregar mapa');
      
      const data = await response.json();
      const items: QuarteiraoMapItem[] = data.features.map((f: any) => ({
        id: f.properties.id,
        nome: f.properties.nome,
        numero: f.properties.numero,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        color: f.properties.color,
      }));
      
      setQuarteiroes(items);
      setPaginaAtual(1);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar o mapa');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuarteiroes();
  };

  const handleOpenLocation = (lat: number, lng: number) => {
    openStreetView(lat, lng);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
      
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🗺️ Mapa</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.controls, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.controlsLeft}>
          <Text style={[styles.totalText, { color: colors.textSecondary }]}>
            📍 {totalItens} quarteirões
          </Text>
        </View>

        <View style={styles.controlsRight}>
          <View style={styles.itemsPerPageContainer}>
            <Text style={styles.itemsPerPageLabel}>Itens:</Text>
            <View style={styles.itemsPerPageButtons}>
              {opcoesItensPorPagina.map((quantidade) => (
                <TouchableOpacity
                  key={`items-${quantidade}`}
                  style={[
                    styles.itemsPerPageButton,
                    itensPorPagina === quantidade && styles.itemsPerPageButtonActive
                  ]}
                  onPress={() => {
                    setItensPorPagina(quantidade);
                    setPaginaAtual(1);
                  }}
                >
                  <Text style={[
                    styles.itemsPerPageButtonText,
                    itensPorPagina === quantidade && styles.itemsPerPageButtonTextActive
                  ]}>
                    {quantidade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {loading && quarteiroes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>⏳</Text>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando...</Text>
        </View>
      ) : quarteiroes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhum quarteirão com coordenadas
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView 
            style={styles.scrollContainer} 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {quarteiroesPagina.map((q) => (
              <View key={q.id} style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.colorDot, { backgroundColor: q.color }]} />
                    <View style={styles.nomeContainer}>
                      <Text style={[styles.nomeText, { color: colors.text }]}>📍 {q.nome}</Text>
                      <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>Quarteirão #{q.numero}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>🌍 Latitude:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{q.latitude.toFixed(6)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>🌍 Longitude:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{q.longitude.toFixed(6)}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity 
                    style={styles.mapButton} 
                    onPress={() => handleOpenLocation(q.latitude, q.longitude)}
                  >
                    <Text style={styles.actionButtonText}>🗺️ Abrir no Mapa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {totalItens > itensPorPagina && (
            <View style={[styles.paginacaoContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.navButton, paginaAtual === 1 && styles.navButtonDisabled]}
                onPress={() => paginaAtual > 1 && setPaginaAtual(paginaAtual - 1)}
                disabled={paginaAtual === 1}
              >
                <Text style={[
                  styles.navButtonText,
                  paginaAtual === 1 && styles.navButtonTextDisabled
                ]}>
                  ⬅️ Anterior
                </Text>
              </TouchableOpacity>

              <View style={styles.paginasContainer}>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const inicioPaginas = Math.max(1, paginaAtual - 2);
                  const pagina = inicioPaginas + i;
                  if (pagina > totalPaginas) return null;
                  return (
                    <TouchableOpacity
                      key={pagina}
                      style={[
                        styles.paginaButton,
                        paginaAtual === pagina && styles.paginaButtonActive
                      ]}
                      onPress={() => setPaginaAtual(pagina)}
                    >
                      <Text style={[
                        styles.paginaButtonText,
                        paginaAtual === pagina && styles.paginaButtonTextActive
                      ]}>
                        {pagina}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.navButton, paginaAtual === totalPaginas && styles.navButtonDisabled]}
                onPress={() => paginaAtual < totalPaginas && setPaginaAtual(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
              >
                <Text style={[
                  styles.navButtonText,
                  paginaAtual === totalPaginas && styles.navButtonTextDisabled
                ]}>
                  Próxima ➡️
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {quarteiroes.length > 0 && (
        <View style={[styles.paginationInfo, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Text style={[styles.paginationText, { color: colors.textSecondary }]}>
            Mostrando {inicio + 1} - {Math.min(fim, totalItens)} de {totalItens}
          </Text>
          <Text style={[styles.paginationText, { color: colors.textSecondary }]}>
            Página {paginaAtual} de {totalPaginas}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  headerRight: { width: 40 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  controlsLeft: { flex: 1 },
  controlsRight: { alignItems: 'flex-end' },
  totalText: { fontSize: 14, fontWeight: '600' },
  itemsPerPageContainer: { alignItems: 'center' },
  itemsPerPageLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  itemsPerPageButtons: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 6, padding: 2 },
  itemsPerPageButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginHorizontal: 2 },
  itemsPerPageButtonActive: { backgroundColor: '#FFFFFF', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  itemsPerPageButtonText: { fontSize: 12, color: '#666', fontWeight: '600' },
  itemsPerPageButtonTextActive: { color: '#4CAF50' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingIcon: { fontSize: 48, marginBottom: 16 },
  loadingText: { fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  scrollContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
  nomeContainer: { flex: 1 },
  nomeText: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  subtitleText: { fontSize: 13 },
  cardDetails: { marginBottom: 12, paddingTop: 12, borderTopWidth: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 13, marginBottom: 2, fontWeight: '600' },
  detailValue: { fontSize: 14 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 12, borderTopWidth: 1 },
  mapButton: { borderColor: '#2196F3', backgroundColor: '#E3F2FD', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1 },
  actionButtonText: { fontSize: 13, fontWeight: '600' },
  paginacaoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  navButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#F5F5F7' },
  navButtonDisabled: { backgroundColor: '#F0F0F0', opacity: 0.5 },
  navButtonText: { fontSize: 13, color: '#333', fontWeight: '600' },
  navButtonTextDisabled: { color: '#999' },
  paginasContainer: { flexDirection: 'row', alignItems: 'center' },
  paginaButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2, backgroundColor: '#F5F5F7' },
  paginaButtonActive: { backgroundColor: '#4CAF50' },
  paginaButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  paginaButtonTextActive: { color: '#FFFFFF' },
  paginationInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  paginationText: { fontSize: 12 },
});

export default MapaScreen;
