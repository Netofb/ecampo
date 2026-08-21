import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface MapPolygonData {
  geojson: object;
  centroid: { lat: number; lng: number };
  bounds: [[number, number], [number, number]];
  area_m2: number;
}

export interface MapMarkerData {
  lat: number;
  lng: number;
}

interface Props {
  initialPolygon?: object | null;
  initialCenter?: { lat: number; lng: number };
  interactive?: boolean;
  onPolygonChanged?: (data: MapPolygonData) => void;
  onMarkerChanged?: (data: MapMarkerData) => void;
  onReady?: () => void;
  height?: number;
  /** Ref do ScrollView pai para desabilitar scroll enquanto o mapa está sendo tocado */
  parentScrollRef?: React.RefObject<ScrollView>;
}

const DEFAULT_CENTER = { lat: -8.3797, lng: -35.4508 }; // Amaraji-PE

const buildHtml = (
  center: { lat: number; lng: number },
  initialPolygon: object | null,
  interactive: boolean
) => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; overflow:hidden; }
  #map { width:100%; height:100%; touch-action:none; }
  .leaflet-draw-toolbar a { background-size: 300px 30px !important; }
  #btn-bar {
    position:absolute; bottom:10px; left:50%; transform:translateX(-50%);
    z-index:1000; display:flex; gap:6px;
  }
  .map-btn {
    background:#fff; border:2px solid #4CAF50; color:#4CAF50;
    padding:6px 12px; border-radius:6px; font-size:13px; font-weight:600;
    cursor:pointer; white-space:nowrap;
  }
  .map-btn.danger { border-color:#e53935; color:#e53935; }
</style>
</head>
<body>
<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
<script>
var map = L.map('map', { zoomControl: true }).setView([${center.lat}, ${center.lng}], 15);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 20,
  subdomains: 'abcd'
}).addTo(map);

var drawnItems = new L.FeatureGroup().addTo(map);
var marker = null;

var drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: {
    polygon: { shapeOptions: { color: '#4CAF50', fillOpacity: 0.2 } },
    polyline: false, rectangle: false, circle: false,
    circlemarker: false, marker: false
  }
});
map.addControl(drawControl);

if (!${interactive}) {
  map.dragging.disable();
  map.touchZoom.disable();
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.disable();
  map.boxZoom.disable();
  map.keyboard.disable();
  if (map.tap) map.tap.disable();
  map.removeControl(drawControl);
}

function postMsg(type, payload) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
  }
}

function calcArea(latlngs) {
  // Shoelace formula in meters (approximate, flat earth)
  var R = 6371000;
  var n = latlngs.length;
  var area = 0;
  for (var i = 0; i < n; i++) {
    var j = (i + 1) % n;
    var xi = latlngs[i].lng * Math.PI / 180 * R * Math.cos(latlngs[i].lat * Math.PI / 180);
    var yi = latlngs[i].lat * Math.PI / 180 * R;
    var xj = latlngs[j].lng * Math.PI / 180 * R * Math.cos(latlngs[j].lat * Math.PI / 180);
    var yj = latlngs[j].lat * Math.PI / 180 * R;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2);
}

function getCentroid(latlngs) {
  var lat = 0, lng = 0;
  latlngs.forEach(function(p) { lat += p.lat; lng += p.lng; });
  return { lat: lat / latlngs.length, lng: lng / latlngs.length };
}

function emitPolygon() {
  var layers = [];
  drawnItems.eachLayer(function(l) { if (l instanceof L.Polygon) layers.push(l); });
  if (layers.length === 0) return;
  var poly = layers[layers.length - 1];
  var latlngs = poly.getLatLngs()[0];
  var geojson = poly.toGeoJSON();
  var bounds = poly.getBounds();
  var area = calcArea(latlngs);
  var centroid = getCentroid(latlngs);
  postMsg('POLYGON_CHANGED', {
    geojson: geojson,
    centroid: centroid,
    bounds: [[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]],
    area_m2: area
  });
}

map.on(L.Draw.Event.CREATED, function(e) {
  // Remove previous polygon, keep only one
  var toRemove = [];
  drawnItems.eachLayer(function(l) { if (l instanceof L.Polygon) toRemove.push(l); });
  toRemove.forEach(function(l) { drawnItems.removeLayer(l); });
  drawnItems.addLayer(e.layer);
  emitPolygon();
});

map.on(L.Draw.Event.EDITED, function() { emitPolygon(); });
map.on(L.Draw.Event.DELETED, function() {
  postMsg('POLYGON_CHANGED', null);
});

map.on('click', function(e) {
  setMarker(e.latlng.lat, e.latlng.lng);
});

function setMarker(lat, lng) {
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lng], { draggable: true }).addTo(map);
  marker.on('dragend', function() {
    var pos = marker.getLatLng();
    postMsg('LOCATION_CHANGED', { lat: pos.lat, lng: pos.lng });
  });
  postMsg('LOCATION_CHANGED', { lat: lat, lng: lng });
}

function detectLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(function(pos) {
    var lat = pos.coords.latitude, lng = pos.coords.longitude;
    map.setView([lat, lng], 17);
    setMarker(lat, lng);
  }, function() {
    postMsg('ERROR', { message: 'Geolocalização não disponível' });
  });
}

function fitPolygon() {
  var layers = [];
  drawnItems.eachLayer(function(l) { if (l instanceof L.Polygon) layers.push(l); });
  if (layers.length > 0) map.fitBounds(layers[layers.length - 1].getBounds(), { padding: [20, 20] });
}

function clearAll() {
  drawnItems.clearLayers();
  if (marker) { map.removeLayer(marker); marker = null; }
  postMsg('POLYGON_CHANGED', null);
}

function handleCommand(cmd) {
  if (cmd.type === 'SET_POLYGON' && cmd.payload) {
    drawnItems.clearLayers();
    var layer = L.geoJSON(cmd.payload, {
      style: { color: '#4CAF50', fillOpacity: 0.2 }
    });
    layer.eachLayer(function(l) { drawnItems.addLayer(l); });
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  } else if (cmd.type === 'SET_CENTER') {
    map.setView([cmd.payload.lat, cmd.payload.lng], cmd.payload.zoom || 16);
    setMarker(cmd.payload.lat, cmd.payload.lng);
  } else if (cmd.type === 'SET_MARKER') {
    setMarker(cmd.payload.lat, cmd.payload.lng);
  }
}

// Load initial polygon
${initialPolygon ? `handleCommand({ type: 'SET_POLYGON', payload: ${JSON.stringify(initialPolygon)} });` : ''}

postMsg('MAP_READY', {});
</script>
</body>
</html>`;

export interface QuarteiraoMapHandle {
  injectJavaScript: (js: string) => void;
  setCenter: (lat: number, lng: number, zoom?: number) => void;
  setPolygon: (geojson: object) => void;
  setMarker: (lat: number, lng: number) => void;
}

const QuarteiraoMapWebView = forwardRef<QuarteiraoMapHandle, Props>((
  {
    initialPolygon = null,
    initialCenter = DEFAULT_CENTER,
    interactive = true,
    onPolygonChanged,
    onMarkerChanged,
    onReady,
    height = 320,
    parentScrollRef,
  },
  ref
) => {
  const webviewRef = useRef<WebView>(null);

  const sendCommand = useCallback((type: string, payload: object | null) => {
    const js = `handleCommand(${JSON.stringify({ type, payload })});true;`;
    webviewRef.current?.injectJavaScript(js);
  }, []);

  useImperativeHandle(ref, () => ({
    injectJavaScript: (js: string) => webviewRef.current?.injectJavaScript(js),
    setCenter: (lat, lng, zoom = 16) => sendCommand('SET_CENTER', { lat, lng, zoom }),
    setPolygon: (geojson) => sendCommand('SET_POLYGON', geojson),
    setMarker: (lat, lng) => sendCommand('SET_MARKER', { lat, lng }),
  }));

  const setCenter = useCallback(
    (lat: number, lng: number, zoom = 16) => sendCommand('SET_CENTER', { lat, lng, zoom }),
    [sendCommand]
  );

  const setPolygon = useCallback(
    (geojson: object) => sendCommand('SET_POLYGON', geojson),
    [sendCommand]
  );

  const setMarker = useCallback(
    (lat: number, lng: number) => sendCommand('SET_MARKER', { lat, lng }),
    [sendCommand]
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'MAP_READY') onReady?.();
        else if (msg.type === 'POLYGON_CHANGED') onPolygonChanged?.(msg.payload);
        else if (msg.type === 'LOCATION_CHANGED') onMarkerChanged?.(msg.payload);
      } catch {}
    },
    [onReady, onPolygonChanged, onMarkerChanged]
  );

  const html = buildHtml(initialCenter, initialPolygon, interactive);

  return (
    <View
      style={[styles.container, { height }]}
      onTouchStart={() => parentScrollRef?.current?.setNativeProps({ scrollEnabled: false })}
      onTouchEnd={() => parentScrollRef?.current?.setNativeProps({ scrollEnabled: true })}
      onTouchCancel={() => parentScrollRef?.current?.setNativeProps({ scrollEnabled: true })}
    >
      <WebView
        ref={webviewRef}
        source={{ html }}
        style={styles.webview}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsInlineMediaPlayback
        scrollEnabled={false}
        nestedScrollEnabled={false}
        overScrollMode="never"
      />
    </View>
  );
});

export { QuarteiraoMapWebView };
export type { Props as QuarteiraoMapWebViewProps };

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  webview: { flex: 1 },
});

export default QuarteiraoMapWebView;
