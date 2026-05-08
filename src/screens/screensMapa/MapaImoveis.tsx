import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, Text, TouchableOpacity, View, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { imovelService } from '../../services/api';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';


type FeatureCollection = {
  type: 'FeatureCollection';
  features: any[];
};

type MapMessage =
  | { type: 'ready' }
  | { type: 'feature_click'; id?: string | number; nome?: string; lat?: number; lng?: number }
  | { type: 'open_maps'; lat: number; lng: number }
  | { type: 'open_streetview'; lat: number; lng: number }
  | { type: 'error'; message: string };

function openGoogleMaps(lat: number, lng: number) {
  return Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
}

function openStreetView(lat: number, lng: number) {
  return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
}

async function fetchGeoJson(): Promise<FeatureCollection> {
  const data = await imovelService.list();
  
  const features = data
    .filter((i: any) => i.latitude && i.longitude)
    .map((i: any) => ({
      type: 'Feature',
      id: i.id_imovel,
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(i.longitude), parseFloat(i.latitude)]
      },
      properties: {
        id: i.id_imovel,
        logradouro: i.nome_logradouro || 'Sem endereço',
        numero: i.numero || 'S/N',
        color: '#9C27B0'
      }
    }));

  return {
    type: 'FeatureCollection',
    features
  };
}

function safeJsonForHtml(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildLeafletHtml(geojson: FeatureCollection) {
  const geoStr = safeJsonForHtml(geojson);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <style>
    html, body { height: 100%; margin: 0; padding: 0; background: #fff; }
    #map { height: 100%; width: 100%; }
    .leaflet-popup-content { margin: 10px 12px; }
    .title { font-weight: 800; margin-bottom: 6px; }
    .sub { opacity: 0.8; margin-bottom: 10px; }
    .btnRow { display:flex; gap:8px; flex-wrap: wrap; }
    .btn {
      padding: 8px 10px;
      border: 1px solid #ddd;
      border-radius: 10px;
      font-weight: 700;
      background: #fff;
      cursor: pointer;
      user-select: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    const RN = window.ReactNativeWebView;
    function post(msg) {
      try { RN && RN.postMessage(JSON.stringify(msg)); } catch (e) {}
    }

    const geojson = ${geoStr};
    const map = L.map('map', { zoomControl: true, preferCanvas: true });

    const baseOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap'
    });

    baseOSM.addTo(map);

    const layerMarkers = L.layerGroup().addTo(map);

    function makePopupHtml(f) {
      const logradouro = f.properties?.logradouro ?? "";
      const numero = f.properties?.numero ?? "";
      const lat = f.geometry?.coordinates?.[1] ?? null;
      const lng = f.geometry?.coordinates?.[0] ?? null;

      return \`
        <div class="title">🏠 \${logradouro}, \${numero}</div>
        <div class="btnRow">
          <div class="btn" onclick="window.__openMaps(\${lat}, \${lng})">🗺️ Google Maps</div>
          <div class="btn" onclick="window.__openStreet(\${lat}, \${lng})">🌍 Street View</div>
        </div>
      \`;
    }

    window.__openMaps = (lat, lng) => {
      if (typeof lat !== "number" || typeof lng !== "number") return;
      post({ type: "open_maps", lat, lng });
    };

    window.__openStreet = (lat, lng) => {
      if (typeof lat !== "number" || typeof lng !== "number") return;
      post({ type: "open_streetview", lat, lng });
    };

    function addGeoJson(fc) {
      layerMarkers.clearLayers();

      const pointLayer = L.geoJSON(fc, {
        filter: (f) => f?.geometry?.type === "Point",
        pointToLayer: (f, latlng) => {
          const color = f.properties?.color || "#9C27B0";
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: color,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          });
        },
        onEachFeature: (f, layer) => {
          layer.on("click", () => {
            const logradouro = f.properties?.logradouro ?? "";
            const numero = f.properties?.numero ?? "";
            post({
              type: "feature_click",
              id: f.properties?.id ?? f.id,
              nome: \`\${logradouro}, \${numero}\`,
              lat: layer.getLatLng().lat,
              lng: layer.getLatLng().lng
            });
          });
          layer.bindPopup(makePopupHtml(f));
        }
      }).addTo(layerMarkers);

      try {
        const b = pointLayer.getBounds();
        if (b.isValid()) map.fitBounds(b.pad(0.2));
        else map.setView([-8.05224, -34.928609], 13);
      } catch (e) {
        map.setView([-8.05224, -34.928609], 13);
      }
    }

    try {
      addGeoJson(geojson);
      post({ type: "ready" });
    } catch (e) {
      post({ type: "error", message: (e && e.message) ? e.message : "Erro ao renderizar GeoJSON" });
    }
  </script>
</body>
</html>`;
}

const MapaImoveis: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  const html = useMemo(() => {
    if (!geo) return null;
    return buildLeafletHtml(geo);
  }, [geo]);

  const load = useCallback(async () => {
    setLoading(true);
    setSelectedLabel('');
    try {
      const data = await fetchGeoJson();
      setGeo(data);
    } catch (e: any) {
      Alert.alert('Mapa', e?.message ?? 'Falha ao carregar GeoJSON.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onMessage = useCallback(async (ev: WebViewMessageEvent) => {
    let msg: MapMessage | null = null;
    try {
      msg = JSON.parse(ev.nativeEvent.data);
    } catch {
      return;
    }

    if (!msg) return;

    if (msg.type === 'error') {
      Alert.alert('Mapa', msg.message);
      return;
    }

    if (msg.type === 'feature_click') {
      const label = `Selecionado: ${msg.nome ?? msg.id ?? ''}`;
      setSelectedLabel(label);
      return;
    }

    if (msg.type === 'open_maps') {
      await openGoogleMaps(msg.lat, msg.lng);
      return;
    }

    if (msg.type === 'open_streetview') {
      await openStreetView(msg.lat, msg.lng);
      return;
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 8, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <FontAwesome5 name="house-user" size={18} color="#9C27B0" style={{ marginRight: 15 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}> Mapa de Imóveis</Text>
          {!!selectedLabel && <Text style={{ marginTop: 4, opacity: 0.8, color: colors.textSecondary }}>{selectedLabel}</Text>}
        </View>

        <TouchableOpacity
          onPress={load}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ fontWeight: '800', color: colors.text }}><FontAwesome5 name="sync" size={18} color="#9C27B0" style={{ marginRight: 8 }} /></Text>}
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {!html ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textSecondary }}>Carregando mapa...</Text>
          </View>
        ) : (
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html }}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            onMessage={onMessage}
            setSupportMultipleWindows={false}
            allowsBackForwardNavigationGestures
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MapaImoveis;
