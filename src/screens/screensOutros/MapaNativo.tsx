import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
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

const MapaNativoScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [quarteiroes, setQuarteiroes] = useState<QuarteiraoMapItem[]>([]);
  const [selectedQuarteirao, setSelectedQuarteirao] = useState<QuarteiraoMapItem | null>(null);

  useEffect(() => {
    loadQuarteiroes();
  }, []);

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
      
      // Centralizar mapa nos quarteirões
      if (items.length > 0 && mapRef.current) {
        const lats = items.map(q => q.latitude);
        const lngs = items.map(q => q.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        const region: Region = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5),
          longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5),
        };
        
        setTimeout(() => {
          mapRef.current?.animateToRegion(region, 1000);
        }, 500);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar o mapa');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (q: QuarteiraoMapItem) => {
    setSelectedQuarteirao(q);
    mapRef.current?.animateToRegion({
      latitude: q.latitude,
      longitude: q.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  const initialRegion: Region = {
    latitude: -8.052240,
    longitude: -34.928609,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
      
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🗺️ Mapa Interativo</Text>
        <TouchableOpacity style={styles.reloadButton} onPress={loadQuarteiroes}>
          <Text style={{ fontSize: 20 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando mapa...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {quarteiroes.map((q) => (
              <Marker
                key={q.id}
                coordinate={{
                  latitude: q.latitude,
                  longitude: q.longitude,
                }}
                pinColor={q.color}
                title={q.nome}
                description={`Quarteirão #${q.numero}`}
                onPress={() => handleMarkerPress(q)}
              />
            ))}
          </MapView>

          {selectedQuarteirao && (
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <View style={styles.infoHeader}>
                <View style={styles.infoHeaderLeft}>
                  <View style={[styles.colorDot, { backgroundColor: selectedQuarteirao.color }]} />
                  <View>
                    <Text style={[styles.infoTitle, { color: colors.text }]}>{selectedQuarteirao.nome}</Text>
                    <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
                      Quarteirão #{selectedQuarteirao.numero}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedQuarteirao(null)}>
                  <Text style={{ fontSize: 24, color: colors.textSecondary }}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.infoCoords}>
                <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>
                  📍 {selectedQuarteirao.latitude.toFixed(6)}, {selectedQuarteirao.longitude.toFixed(6)}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.openButton, { backgroundColor: colors.primary }]}
                onPress={() => openStreetView(selectedQuarteirao.latitude, selectedQuarteirao.longitude)}
              >
                <Text style={styles.openButtonText}>🗺️ Abrir no Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statsText, { color: colors.textSecondary }]}>
              📍 {quarteiroes.length} quarteirões
            </Text>
          </View>
        </>
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
  reloadButton: { padding: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },
  map: { flex: 1 },
  infoCard: { position: 'absolute', bottom: 80, left: 16, right: 16, borderRadius: 12, padding: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
  infoTitle: { fontSize: 16, fontWeight: 'bold' },
  infoSubtitle: { fontSize: 13, marginTop: 2 },
  infoCoords: { marginBottom: 12 },
  coordLabel: { fontSize: 12 },
  openButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  openButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  statsCard: { position: 'absolute', top: 80, left: 16, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  statsText: { fontSize: 14, fontWeight: '600' },
});

export default MapaNativoScreen;
