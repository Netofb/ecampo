import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { addFotoLocal } from '../../services/fotoLocal';
import { addPontoLocal } from '../../services/pontoLocal';

const GPS: React.FC = () => {
  const [uri, setUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPoint, setSavingPoint] = useState(false);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== Location.PermissionStatus.GRANTED) Alert.alert('Localização', 'Permissão de localização não concedida.');
    }).catch(() => Alert.alert('Localização', 'Não foi possível solicitar a localização.'));
  }, []);

  const capture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert('Foto', 'Permissão da câmera não concedida.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setUri(result.assets[0].uri);
  };

  const save = async () => {
    if (!uri) { Alert.alert('Foto', 'Capture uma foto antes de salvar.'); return; }
    setSaving(true);
    try {
      const current = location || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await addFotoLocal({
        uri,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy ?? undefined,
        vinculoTipo: 'geral',
        observacao: observacao.trim(),
      });
      setUri(null); setObservacao(''); setLocation(current);
      Alert.alert('Foto', 'Foto georreferenciada salva localmente e marcada como pendente de sincronização.');
    } catch (error: any) {
      Alert.alert('Foto', error?.message || 'Não foi possível salvar a foto.');
    } finally { setSaving(false); }
  };

  const refreshLocation = async () => {
    try { setLocation(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })); }
    catch { Alert.alert('Localização', 'Não foi possível obter a posição atual.'); }
  };

  const savePoint = async () => {
    setSavingPoint(true);
    try {
      const current = location || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await addPontoLocal({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy ?? undefined,
        descricao: observacao.trim(),
      });
      setLocation(current);
      setObservacao('');
      Alert.alert('Ponto de referência', 'Ponto salvo localmente e marcado para sincronização.');
    } catch (error: any) {
      Alert.alert('Localização', error?.message || 'Não foi possível salvar o ponto.');
    } finally { setSavingPoint(false); }
  };

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Foto georreferenciada</Text>
    <Text style={styles.subtitle}>Registre uma evidência de campo com posição e horário.</Text>
    <TouchableOpacity style={styles.button} onPress={capture}><Text style={styles.buttonText}>Tirar foto</Text></TouchableOpacity>
    {uri && <Image source={{ uri }} style={styles.preview} />}
    <TouchableOpacity style={styles.locationButton} onPress={refreshLocation}><Text style={styles.locationText}>{location ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}` : 'Atualizar localização'}</Text></TouchableOpacity>
    <TextInput style={styles.input} placeholder="Observação (opcional)" value={observacao} onChangeText={setObservacao} multiline />
    <TouchableOpacity style={[styles.locationButton, savingPoint && styles.disabled]} onPress={savePoint} disabled={savingPoint}><Text style={styles.locationText}>{savingPoint ? 'Salvando ponto...' : 'Salvar ponto de referência'}</Text></TouchableOpacity>
    <TouchableOpacity style={[styles.button, !uri && styles.disabled]} onPress={save} disabled={!uri || saving}><Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar evidência'}</Text></TouchableOpacity>
    <View style={styles.pending}><Text style={styles.pendingText}>As fotos ficam no aparelho até a sincronização ser implementada.</Text></View>
  </ScrollView>;
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#F5F5F7' },
  title: { fontSize: 24, fontWeight: '800', color: '#17343B', marginBottom: 6 },
  subtitle: { color: '#4A5568', marginBottom: 22 },
  button: { minHeight: 46, borderRadius: 8, backgroundColor: '#176B68', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  preview: { width: '100%', height: 240, borderRadius: 8, marginBottom: 12, backgroundColor: '#D7E2DF' },
  locationButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: '#D7E2DF', backgroundColor: '#FFFFFF', justifyContent: 'center', paddingHorizontal: 12, marginBottom: 12 },
  locationText: { color: '#17343B', fontWeight: '600' },
  input: { minHeight: 80, backgroundColor: '#FFFFFF', borderColor: '#D7E2DF', borderWidth: 1, borderRadius: 8, padding: 12, textAlignVertical: 'top', marginBottom: 12 },
  pending: { padding: 12, borderRadius: 8, backgroundColor: '#FFF7ED' },
  pendingText: { color: '#9A3412', fontSize: 12 },
});

export default GPS;
