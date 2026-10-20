import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export type FaceLineMapData = {
  geojson: object;
  centroid: { lat: number; lng: number };
};

type Props = {
  center?: { lat: number; lng: number };
  initialPolygon?: object | null;
  initialLine?: object | null;
  color?: string;
  height?: number;
  onLineChanged?: (data: FaceLineMapData | null) => void;
};

const DEFAULT_CENTER = { lat: -8.3797, lng: -35.4508 };

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildHtml(center: { lat: number; lng: number }, initialPolygon: object | null, initialLine: object | null, color: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><style>html,body,#map{height:100%;margin:0} .leaflet-control{font-size:18px}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const map=L.map('map').setView([${center.lat},${center.lng}],16); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map); const color=${JSON.stringify(color)}; const segments=L.featureGroup().addTo(map); const selectedSegments=[];
function post(type,payload){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type,payload}))}
function emitSelection(){if(!selectedSegments.length){post('LINE_CHANGED',null);return} const coordinates=selectedSegments.map(segment=>segment.line.toGeoJSON().geometry.coordinates); const allPoints=selectedSegments.reduce((points,segment)=>points.concat(segment.line.getLatLngs()),[]); const centroid=allPoints.reduce((result,point)=>({lat:result.lat+point.lat,lng:result.lng+point.lng}),{lat:0,lng:0}); centroid.lat/=allPoints.length; centroid.lng/=allPoints.length; const geometry=coordinates.length===1?{type:'LineString',coordinates:coordinates[0]}:{type:'MultiLineString',coordinates}; post('LINE_CHANGED',{geojson:{type:'Feature',properties:{},geometry},centroid})}
function addRingSegments(ring){if(ring.length<2)return; const isClosed=ring[0].equals(ring[ring.length-1]); const count=isClosed?ring.length-1:ring.length; for(let i=0;i<count;i++){const segment={line:L.polyline([ring[i],ring[(i+1)%ring.length]],{color:'#2E7D32',weight:7,opacity:.35}),hit:null}; segment.hit=L.polyline([ring[i],ring[(i+1)%ring.length]],{color:'#2E7D32',weight:16,opacity:0.01}); const toggle=()=>{const index=selectedSegments.indexOf(segment); if(index >= 0){selectedSegments.splice(index,1);segment.line.setStyle({color:'#2E7D32',weight:7,opacity:.35})}else{selectedSegments.push(segment);segment.line.setStyle({color:color,weight:7,opacity:1})} emitSelection()}; segment.hit.on('click',toggle); segment.line.on('click',toggle); segments.addLayer(segment.line);segments.addLayer(segment.hit)}}
function collectRings(value){if(!Array.isArray(value)||!value.length)return;if(typeof value[0]?.lat==='number'){addRingSegments(value);return} value.forEach(collectRings)}
${initialPolygon ? `const quarteirao=L.geoJSON(${safeJson(initialPolygon)},{style:{color:'#2E7D32',weight:3,fillColor:'#2E7D32',fillOpacity:.12}}).addTo(map);quarteirao.eachLayer(layer=>collectRings(layer.getLatLngs()));map.fitBounds(quarteirao.getBounds(),{padding:[20,20]});` : ''}
${initialLine ? `const initial=L.geoJSON(${safeJson(initialLine)},{style:{color:color,weight:5}}).addTo(map);map.fitBounds(initial.getBounds(),{padding:[20,20]});` : ''}
</script></body></html>`;
}

const FaceLineMapEditor: React.FC<Props> = ({ center = DEFAULT_CENTER, initialPolygon = null, initialLine = null, color = '#1565C0', height = 300, onLineChanged }) => {
  const html = useMemo(() => buildHtml(center, initialPolygon, initialLine, color), [center, initialPolygon, initialLine, color]);
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
