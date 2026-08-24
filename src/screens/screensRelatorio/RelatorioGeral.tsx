import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { faceService, getApiUrlForDisplay, imovelService, localidadeService, quarteiraoService, authService, zonaService } from '../../services/api';
import { listFotosLocais } from '../../services/fotoLocal';
import { listPontosLocais } from '../../services/pontoLocal';
import { listProducaoLocal } from '../../services/producaoLocal';

type Report = { localidades: number; zonas: number; quarteiroes: number; faces: number; imoveis: number; producoes: number; fotos: number; pontos: number };
const emptyReport: Report = { localidades: 0, zonas: 0, quarteiroes: 0, faces: 0, imoveis: 0, producoes: 0, fotos: 0, pontos: 0 };

const RelatorioGeral: React.FC = () => {
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authService.getAuthHeaders();
      const [stats, localidades, zonas, quarteiroes, faces, imoveis, producoes, fotos, pontos] = await Promise.all([
        fetch(`${getApiUrlForDisplay()}/stats`, { headers }).then(response => response.ok ? response.json() : null).catch(() => null),
        localidadeService.list().catch(() => []), zonaService.list().catch(() => []), quarteiraoService.list().catch(() => []), faceService.list().catch(() => []), imovelService.list().catch(() => []),
        listProducaoLocal(), listFotosLocais(), listPontosLocais(),
      ]);
      setReport({
        localidades: localidades.length,
        zonas: zonas.length,
        quarteiroes: Number(stats?.quarteiroes ?? quarteiroes.length),
        faces: Number(stats?.faces ?? faces.length),
        imoveis: Number(stats?.imoveis ?? imoveis.length),
        producoes: producoes.length,
        fotos: fotos.length,
        pontos: pontos.length,
      });
    } catch (error: any) {
      Alert.alert('Relatório geral', error?.message || 'Não foi possível carregar o relatório local.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cards = [
    ['Localidades', report.localidades], ['Zonas', report.zonas], ['Quarteirões', report.quarteiroes],
    ['Faces', report.faces], ['Imóveis', report.imoveis], ['Produções locais', report.producoes],
    ['Fotos pendentes', report.fotos], ['Pontos pendentes', report.pontos],
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.title}>Relatório geral</Text>
      <Text style={styles.subtitle}>Visão operacional dos cadastros sincronizados.</Text>
      {loading && !Object.values(report).some(Boolean) ? <ActivityIndicator size="large" color="#176B68" /> : (
        <View style={styles.grid}>{cards.map(([label, value]) => <View style={styles.card} key={label}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>)}</View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    color: '#4A5568',
    marginBottom: 24,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '47%',
    minHeight: 92,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7E2DF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: '#17343B',
  },
  label: {
    color: '#4A5568',
    fontWeight: '600',
  },
});

export default RelatorioGeral;
