import { Linking, Alert } from 'react-native';

export async function openStreetView(lat: number, lng: number) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erro', 'Não foi possível abrir o mapa');
    }
  } catch (error: any) {
    Alert.alert('Erro', `Não foi possível abrir o mapa: ${error.message}`);
    console.error('Erro ao abrir Street View:', error);
  }
}

export function getStreetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
