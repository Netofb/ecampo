import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { faceService } from '../services/api';

type FeatureCollection = { type: 'FeatureCollection'; features: any[] };

const CACHE_KEY = '@ecampo/mapa-faces';

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildMapHtml(geojson: FeatureCollection) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><style>html,body,#map{height:100%;margin:0} .marker{display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:#2196F3;border:2px solid #fff;border-radius:50%;color:#fff;font:bold 13px Arial;box-shadow:0 2px 5px #555}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const fc=${safeJson(geojson)}; const map=L.map('map',{zoomControl:true,preferCanvas:true}); L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd',attribution:'© OpenStreetMap © CARTO'}).addTo(map);
function point(f){const g=f&&f.geometry;if(!g)return null;if(g.type==='Point')return [g.coordinates[1],g.coordinates[0]];if((g.type==='Polygon'||g.type==='MultiPolygon')&&g.coordinates?.[0]?.[0]){const p=g.type==='Polygon'?g.coordinates[0][0]:g.coordinates[0][0][0];return [p[1],p[0]]}return null}
const faceLine=L.geoJSON(fc,{filter:f=>['LineString','MultiLineString','Polygon','MultiPolygon'].includes(f?.geometry?.type),style:{color:'#3987F6',weight:5,opacity:.95,fillColor:'#3987F6',fillOpacity:0},onEachFeature:(f,l)=>l.bindPopup('<b>Face #'+(f.properties?.numero??'')+'</b><br>'+(f.properties?.quarteirao??''))}).addTo(map);
const bounds=faceLine.getBounds(); if(bounds.isValid())map.fitBounds(bounds.pad(.25));else map.setView([-8.3797,-35.4508],16);
</script></body></html>`;
}

interface FacesMapWebViewProps {
  refreshKey?: number;
  faceId?: number;
}

const FacesMapWebView: React.FC<FacesMapWebViewProps> = ({ refreshKey = 0, faceId }) => {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) setGeo(JSON.parse(cached));
      const data = await faceService.getMap();
      setGeo(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filteredGeo = useMemo(() => {
    if (!geo || faceId == null) return geo;
    return {
      ...geo,
      features: geo.features.filter((feature) => (
        String(feature.properties?.id) === String(faceId) &&
        ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'].includes(feature.geometry?.type)
      )),
    };
  }, [geo, faceId]);

  const html = useMemo(() => filteredGeo ? buildMapHtml(filteredGeo) : null, [filteredGeo]);

  return (
    <View style={styles.container}>
      {html ? <WebView source={{ html }} originWhitelist={['*']} javaScriptEnabled domStorageEnabled mixedContentMode="always" /> : (
        <View style={styles.message}><ActivityIndicator color="#2196F3" /><Text style={styles.messageText}>Carregando mapa de faces...</Text></View>
      )}
      {offline && geo && <View style={styles.offline}><Text style={styles.offlineText}>Mapa offline</Text></View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 260, marginTop: 12, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#DCE5EF', backgroundColor: '#EEF3F8' },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageText: { marginTop: 8, color: '#667085' },
  offline: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FFF3CD' },
  offlineText: { color: '#856404', fontSize: 12, fontWeight: '600' },
});

export default FacesMapWebView;
