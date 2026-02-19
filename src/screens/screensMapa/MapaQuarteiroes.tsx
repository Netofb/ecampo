import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, Text, TouchableOpacity, View, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { authService, getApiUrlForDisplay } from '../../services/api';

const getApiUrl = getApiUrlForDisplay;

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
  const response = await fetch(`${getApiUrl()}/quarteiroes/map`, {
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Erro ao carregar mapa');
  return await response.json();
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

    const layerPolygons = L.layerGroup().addTo(map);
    const layerMarkers = L.layerGroup().addTo(map);

    function pickLatLngFromFeature(f) {
      if (!f || !f.geometry) return null;
      const g = f.geometry;
      if (g.type === "Point" && Array.isArray(g.coordinates)) {
        const lng = g.coordinates[0], lat = g.coordinates[1];
        if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
      }
      if (g.type === "Polygon" && g.coordinates?.[0]?.[0]) {
        const p = g.coordinates[0][0];
        return { lat: p[1], lng: p[0] };
      }
      return null;
    }

    function styleFeature(f) {
      const color = (f.properties && f.properties.color) ? f.properties.color : "#1e88e5";
      return { color, weight: 3, fillColor: color, fillOpacity: 0.35 };
    }

    function makePopupHtml(f) {
      const id = f.properties?.id ?? f.id ?? "";
      const nome = f.properties?.nome ?? "";
      const ll = pickLatLngFromFeature(f);
      const lat = ll ? ll.lat : null;
      const lng = ll ? ll.lng : null;

      return \`
        <div class="title">📍 \${nome}</div>
        <div class="sub">Quarteirão #\${id}</div>
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
      layerPolygons.clearLayers();
      layerMarkers.clearLayers();

      const polygonLayer = L.geoJSON(fc, {
        filter: (f) => f?.geometry?.type === "Polygon" || f?.geometry?.type === "MultiPolygon",
        style: styleFeature,
        onEachFeature: (f, layer) => {
          layer.on("click", () => {
            const ll = pickLatLngFromFeature(f);
            post({
              type: "feature_click",
              id: f.properties?.id ?? f.id,
              nome: f.properties?.nome,
              lat: ll?.lat,
              lng: ll?.lng
            });
          });
          layer.bindPopup(makePopupHtml(f));
        }
      }).addTo(layerPolygons);

      const pointLayer = L.geoJSON(fc, {
        filter: (f) => f?.geometry?.type === "Point",
        pointToLayer: (f, latlng) => L.marker(latlng),
        onEachFeature: (f, layer) => {
          layer.on("click", () => {
            post({
              type: "feature_click",
              id: f.properties?.id ?? f.id,
              nome: f.properties?.nome,
              lat: layer.getLatLng().lat,
              lng: layer.getLatLng().lng
            });
          });
          layer.bindPopup(makePopupHtml(f));
        }
      }).addTo(layerMarkers);

      const group = L.featureGroup([polygonLayer, pointLayer]);
      try {
        const b = group.getBounds();
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

const MapaQuarteiroes: React.FC = () => {
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

        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>📍 Mapa de Quarteirões</Text>
          {!!selectedLabel && <Text style={{ marginTop: 4, opacity: 0.8, color: colors.textSecondary }}>{selectedLabel}</Text>}
        </View>

        <TouchableOpacity
          onPress={load}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ fontWeight: '800', color: colors.text }}>🔄</Text>}
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

export default MapaQuarteiroes;
