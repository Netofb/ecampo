import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export type FaceLineMapData = {
  geojson: object;
  centroid: { lat: number; lng: number };
};

type Props = {
  center?: { lat: number; lng: number };
  initialLine?: object | null;
  color?: string;
  height?: number;
  onLineChanged?: (data: FaceLineMapData | null) => void;
};

const DEFAULT_CENTER = { lat: -8.3797, lng: -35.4508 };

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildHtml(center: { lat: number; lng: number }, initialLine: object | null, color: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/><style>html,body,#map{height:100%;margin:0} .leaflet-control{font-size:18px}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script><script>
const map=L.map('map').setView([${center.lat},${center.lng}],16); L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd',attribution:'© OpenStreetMap © CARTO'}).addTo(map); const drawn=new L.FeatureGroup().addTo(map); const color=${JSON.stringify(color)};
const draw=new L.Control.Draw({edit:{featureGroup:drawn},draw:{polyline:{shapeOptions:{color:color,weight:5}},polygon:false,rectangle:false,circle:false,marker:false,circlemarker:false}}); map.addControl(draw);
function post(type,payload){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type,payload}))}
function emit(){let line=null;drawn.eachLayer(l=>{if(l instanceof L.Polyline&&! (l instanceof L.Polygon)) line=l}); if(!line){post('LINE_CHANGED',null);return} const geo=line.toGeoJSON(); const points=line.getLatLngs(); let lat=0,lng=0; points.forEach(p=>{lat+=p.lat;lng+=p.lng}); post('LINE_CHANGED',{geojson:geo,centroid:{lat:lat/points.length,lng:lng/points.length}})}
map.on(L.Draw.Event.CREATED,e=>{drawn.clearLayers();drawn.addLayer(e.layer);emit()}); map.on(L.Draw.Event.EDITED,emit); map.on(L.Draw.Event.DELETED,emit);
${initialLine ? `const initial=L.geoJSON(${safeJson(initialLine)},{style:{color:color,weight:5}});initial.eachLayer(l=>drawn.addLayer(l));map.fitBounds(initial.getBounds(),{padding:[20,20]});` : ''}
</script></body></html>`;
}

const FaceLineMapEditor: React.FC<Props> = ({ center = DEFAULT_CENTER, initialLine = null, color = '#1565C0', height = 300, onLineChanged }) => {
  const html = useMemo(() => buildHtml(center, initialLine, color), [center, initialLine, color]);
  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'LINE_CHANGED') onLineChanged?.(message.payload);
    } catch {}
  };

  return <View style={[styles.container, { height }]}><WebView source={{ html }} onMessage={onMessage} originWhitelist={['*']} javaScriptEnabled domStorageEnabled mixedContentMode="always" /></View>;
};

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden', borderRadius: 10, borderWidth: 1, borderColor: '#D7E0EA', backgroundColor: '#EEF3F8' },
});

export default FaceLineMapEditor;
