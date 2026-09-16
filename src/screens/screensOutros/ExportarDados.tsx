import React, { useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { faceService, imovelService, localidadeService, quarteiraoService, zonaService } from '../../services/api';
import { listAuditoriaLocal } from '../../services/auditoriaLocal';
import { listFacesLocais } from '../../services/faceLocal';
import { listFotosLocais } from '../../services/fotoLocal';
import { listImoveisLocais } from '../../services/imovelLocal';
import { listPontosLocais } from '../../services/pontoLocal';

const IMPORT_KEY = '@ecampo/importacoes-locais';

function escapeCsv(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: any[]) {
  if (rows.length === 0) return '';
  const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
  return [columns.map(escapeCsv).join(','), ...rows.map(row => columns.map(column => escapeCsv(row[column])).join(','))].join('\n');
}

async function loadData() {
  const [localidades, zonas, quarteiroes, remoteFaces, remoteImoveis, fotos, pontos, auditoria, localFaces, localImoveis] = await Promise.all([
    localidadeService.list().catch(() => []),
    zonaService.list().catch(() => []),
    quarteiraoService.list().catch(() => []),
    faceService.list().catch(() => []),
    imovelService.list().catch(() => []),
    listFotosLocais(),
    listPontosLocais(),
    listAuditoriaLocal(),
    listFacesLocais(),
    listImoveisLocais(),
  ]);
  return {
    localidades,
    zonas,
    quarteiroes,
    faces: [...remoteFaces, ...localFaces],
    imoveis: [...remoteImoveis, ...localImoveis],
    fotos,
    pontos,
    auditoria,
  };
}

const ExportarDados: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const exportData = async () => {
    setLoading(true);
    try {
      const data = await loadData();
      await Share.share({ title: 'Dados do eCampo', message: JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2) });
    } catch (error: any) {
      Alert.alert('Exportação', error?.message || 'Não foi possível exportar os dados.');
    } finally { setLoading(false); }
  };

  const exportCsv = async () => {
    setLoading(true);
    try {
      const data = await loadData();
      const message = Object.entries(data).filter(([, rows]) => rows.length > 0).map(([name, rows]) => `### ${name}\n${toCsv(rows)}`).join('\n\n');
      if (!message) { Alert.alert('Exportação', 'Não há dados disponíveis.'); return; }
      await Share.share({ title: 'Cadastros CSV do eCampo', message });
    } catch (error: any) {
      Alert.alert('Exportação', error?.message || 'Não foi possível exportar os dados.');
    } finally { setLoading(false); }
  };

  const importGeoJson = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/geo+json', 'application/json', 'application/vnd.google-earth.kml+xml', 'text/plain'], copyToCacheDirectory: true });
    if (result.canceled) return;
    setLoading(true);
    try {
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();
      const parsed = JSON.parse(text);
      if (!parsed || parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) throw new Error('O arquivo não é um GeoJSON FeatureCollection válido.');
      const current = await AsyncStorage.getItem(IMPORT_KEY);
      const imports = current ? JSON.parse(current) : [];
      imports.unshift({ id: Date.now().toString(), name: file.name, importedAt: new Date().toISOString(), featureCount: parsed.features.length, data: parsed });
      await AsyncStorage.setItem(IMPORT_KEY, JSON.stringify(imports));
      Alert.alert('Importação', `${parsed.features.length} feição(ões) importada(s) localmente.`);
    } catch (error: any) {
      Alert.alert('Importação', error?.message || 'Não foi possível ler o arquivo. Use GeoJSON válido.');
    } finally { setLoading(false); }
  };

  return <View style={styles.container}>
    <Text style={styles.title}>Importar e exportar</Text>
    <Text style={styles.description}>Troque dados estruturados sem alterar o banco local ou o servidor.</Text>
    <TouchableOpacity style={styles.button} onPress={exportData} disabled={loading}><Text style={styles.buttonText}>Exportar pacote JSON</Text></TouchableOpacity>
    <TouchableOpacity style={styles.secondaryButton} onPress={exportCsv} disabled={loading}><Text style={styles.secondaryText}>Exportar CSV</Text></TouchableOpacity>
    <TouchableOpacity style={styles.secondaryButton} onPress={importGeoJson} disabled={loading}>{loading ? <ActivityIndicator color="#176B68" /> : <Text style={styles.secondaryText}>Importar GeoJSON</Text>}</TouchableOpacity>
    <Text style={styles.note}>Importações ficam pendentes localmente até existir sincronização com o servidor.</Text>
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F7' },
  title: { fontSize: 24, fontWeight: '800', color: '#17343B', marginBottom: 8 },
  description: { color: '#4A5568', marginBottom: 24 },
  button: { minHeight: 46, borderRadius: 8, backgroundColor: '#176B68', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: '#176B68', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  secondaryText: { color: '#176B68', fontWeight: '700' },
  note: { color: '#9A3412', backgroundColor: '#FFF7ED', padding: 12, borderRadius: 8, fontSize: 12 },
});

export default ExportarDados;
