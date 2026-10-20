import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { authService, faceService, getApiUrlForDisplay, imovelService, localidadeService, quarteiraoService, zonaService } from '../../services/api';
import { listPontosLocais } from '../../services/pontoLocal';

type FeatureCollection = { type: 'FeatureCollection'; features: any[] };
type LayerKey = 'municipal' | 'zonas' | 'localidades' | 'quarteiroes' | 'faces' | 'imoveis' | 'pontos';
type Stats = { zonas: number; localidades: number; quarteiroes: number; faces: number; imoveis: number; total: number };
const EMPTY_GEO: FeatureCollection = { type: 'FeatureCollection', features: [] };
const LAYERS: { key: LayerKey; label: string; icon: string }[] = [
  { key: 'municipal', label: 'Malha municipal', icon: 'map' }, { key: 'zonas', label: 'Zonas', icon: 'draw-polygon' },
  { key: 'localidades', label: 'Localidades', icon: 'city' }, { key: 'quarteiroes', label: 'Quarteirões', icon: 'th' },
  { key: 'faces', label: 'Faces', icon: 'road' }, { key: 'imoveis', label: 'Imóveis', icon: 'home' }, { key: 'pontos', label: 'Pontos', icon: 'map-marker-alt' },
];
const defaultStats: Stats = { zonas: 0, localidades: 0, quarteiroes: 0, faces: 0, imoveis: 0, total: 0 };
const MAP_CACHE_KEY = '@ecampo/mapa-consolidado';

function safeJson(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
const DEFAULT_CENTER = { lat: -8.3797, lng: -35.4508 };
function findMapCenter(localidades: any[], quarteiroes: any[]) {
  const groups = new Map<string, { count: number; lat: number; lng: number }>();
  quarteiroes.forEach((item) => {
    const lat = Number(item.latitude_quadra);
    const lng = Number(item.longitude_quadra);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const name = String(item.nome_localidade || 'Sem localidade');
    const current = groups.get(name) || { count: 0, lat: 0, lng: 0 };
    groups.set(name, { count: current.count + 1, lat: current.lat + lat, lng: current.lng + lng });
  });

  const mostRegistered = Array.from(groups.values()).sort((a, b) => b.count - a.count)[0];
  if (mostRegistered) {
    return {
      lat: mostRegistered.lat / mostRegistered.count,
      lng: mostRegistered.lng / mostRegistered.count,
    };
  }

  const locality = localidades.find((item) => Number.isFinite(Number(item.latitude_localidade)) && Number.isFinite(Number(item.longitude_localidade)));
  if (locality) return { lat: Number(locality.latitude_localidade), lng: Number(locality.longitude_localidade) };
  return DEFAULT_CENTER;
}
function buildMapHtml(layers: Record<LayerKey, FeatureCollection>, center: { lat: number; lng: number }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"><style>html,body,#map{height:100%;width:100%;margin:0;padding:0;background:#eef2f1}.leaflet-container{font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#eef2f1}.leaflet-control-zoom{border:0!important;box-shadow:0 2px 10px rgba(20,45,55,.18)!important}.leaflet-control-zoom a{width:34px!important;height:34px!important;line-height:34px!important;color:#263b40!important;background:rgba(255,255,255,.95)!important;border:0!important}.leaflet-control-zoom a:first-child{border-radius:9px 9px 0 0}.leaflet-control-zoom a:last-child{border-radius:0 0 9px 9px}.leaflet-control-scale-line{border:2px solid #263b40;border-top:0;background:rgba(255,255,255,.82);color:#263b40;font-weight:700}.style-switcher{display:flex;gap:3px;padding:4px;background:rgba(255,255,255,.94);border:1px solid rgba(30,75,80,.12);border-radius:9px;box-shadow:0 2px 10px rgba(20,45,55,.14)}.style-switcher button{border:0;border-radius:6px;background:transparent;color:#3c5054;padding:6px 8px;font:700 10px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.style-switcher button.active{background:#176b68;color:#fff}.map-marker{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 7px rgba(20,45,55,.28)}.map-marker i{color:#fff;font-size:14px;transform:rotate(45deg)}.title{font-weight:800;margin-bottom:5px;color:#17343b}.sub{opacity:.75}.legend{background:rgba(255,255,255,.94);color:#3c5054;padding:7px 8px;border:1px solid rgba(30,75,80,.12);border-radius:8px;line-height:15px;font:10px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 2px 9px rgba(20,45,55,.14);backdrop-filter:blur(8px)}.legend b{display:block;color:#17343b;margin-bottom:3px;font-size:9px;letter-spacing:.3px}.swatch{display:inline-block;width:17px;height:3px;border-radius:3px;margin-right:4px;vertical-align:middle}.dot{display:inline-block;width:8px;height:8px;border:1px solid #fff;border-radius:50%;margin:0 5px 0 1px;vertical-align:-1px;box-shadow:0 1px 2px rgba(0,0,0,.25)}.leaflet-popup-content-wrapper{border-radius:10px;box-shadow:0 4px 18px rgba(20,45,55,.2)}.leaflet-popup-tip{box-shadow:2px 2px 4px rgba(20,45,55,.08)}</style></head>
<body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const RN=window.ReactNativeWebView;
const data=${safeJson(layers)};
const map=L.map('map',{zoomControl:false,preferCanvas:true,zoomSnap:.5,zoomDelta:.5,minZoom:5,maxZoom:20}).setView([${center.lat},${center.lng}],15);
L.control.zoom({position:'topright'}).addTo(map);
L.control.scale({position:'bottomleft',imperial:false,maxWidth:120}).addTo(map);
const baseLayers={
  mapa:L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}),
  satelite:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'}),
  terreno:L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap contributors &copy; OpenTopoMap'})
};
let activeBase='mapa';
baseLayers[activeBase].addTo(map);
function changeBaseLayer(key){if(!baseLayers[key]||key===activeBase)return;map.removeLayer(baseLayers[activeBase]);baseLayers[key].addTo(map);activeBase=key;map.setMaxZoom(baseLayers[key].options.maxZoom);document.querySelectorAll('.style-switcher button').forEach(button=>button.classList.toggle('active',button.dataset.style===key));}
const styleControl=L.control({position:'topleft'});styleControl.onAdd=()=>{const div=L.DomUtil.create('div','style-switcher');div.innerHTML='<button class="active" data-style="mapa" onclick="changeBaseLayer(&quot;mapa&quot;)"><i class="fas fa-map"></i> Mapa</button><button data-style="satelite" onclick="changeBaseLayer(&quot;satelite&quot;)"><i class="fas fa-satellite"></i> Satélite</button><button data-style="terreno" onclick="changeBaseLayer(&quot;terreno&quot;)"><i class="fas fa-mountain"></i> Terreno</button>';L.DomEvent.disableClickPropagation(div);return div;};styleControl.addTo(map);
const groups={};
function post(message){try{if(RN)RN.postMessage(JSON.stringify(message));}catch(error){}}
function point(feature){const coordinates=feature.geometry&&feature.geometry.coordinates;if(feature.geometry?.type==='Point'&&Array.isArray(coordinates))return{lat:coordinates[1],lng:coordinates[0]};if(feature.geometry?.type==='Polygon'&&coordinates?.[0]?.[0])return{lat:coordinates[0][0][1],lng:coordinates[0][0][0]};return null;}
function popup(feature){const properties=feature.properties||{};return '<div class="title">'+(properties.title||properties.nome||properties.name||'Registro')+'</div><div class="sub">Tipo: '+(properties.tipo||'Outro')+'</div><div class="sub">'+(properties.subtitle||'')+'</div>';}
 function iconFor(key,color){const icons={municipal:'fa-map',zonas:'fa-draw-polygon',localidades:'fa-city',quarteiroes:'fa-th-large',faces:'fa-road',imoveis:'fa-home',pontos:'fa-map-marker-alt'};return L.divIcon({className:'',html:'<div class="map-marker" style="background:'+color+'"><i class="fas '+(icons[key]||'fa-map-marker-alt')+'"></i></div>',iconSize:[30,38],iconAnchor:[15,38],popupAnchor:[0,-34]});}
 function createLayer(key){const collection=data[key]||{features:[]};if(key==='municipal')return L.layerGroup();return L.geoJSON(collection,{style:feature=>({color:feature.properties?.color||'#2f80ed',weight:key==='quarteiroes'?2.5:2,opacity:.95,fillColor:feature.properties?.color||'#2f80ed',fillOpacity:key==='quarteiroes'?.16:.24}),pointToLayer:(feature,latlng)=>L.marker(latlng,{icon:iconFor(key,feature.properties?.color||'#2f80ed')}),onEachFeature:(feature,item)=>{item.bindPopup(popup(feature));item.on('click',()=>{const location=point(feature);post({type:'feature_click',label:feature.properties?.title||feature.properties?.nome||feature.properties?.name||'Registro',lat:location?.lat,lng:location?.lng});});}});}
try{Object.keys(data).forEach(key=>{groups[key]=createLayer(key);groups[key].addTo(map);});}catch(error){post({type:'error',message:error&&error.message?error.message:'Erro ao criar camadas do mapa'});}
const legend=L.control({position:'bottomright'});legend.onAdd=()=>{const div=L.DomUtil.create('div','legend');div.innerHTML='<b>CAMADAS DO TERRITÓRIO</b><div><span class="swatch" style="background:#606060"></span>Malha municipal</div><div><span class="swatch" style="background:#7b1fa2"></span>Zona</div><div><span class="swatch" style="background:#00897b"></span>Localidade</div><div><span class="swatch" style="background:#2f80ed"></span>Quarteirão</div><div><span class="swatch" style="background:#f39c12"></span>Face</div><div><span class="dot" style="background:#2f80ed"></span>R-Residência</div><div><span class="dot" style="background:#e67e22"></span>C-Comércio</div><div><span class="dot" style="background:#27ae60"></span>T-Terreno baldio</div><div><span class="dot" style="background:#8e44ad"></span>Outro</div>';return div;};legend.addTo(map);
window.toggleLayer=key=>{if(!groups[key])return;if(map.hasLayer(groups[key]))map.removeLayer(groups[key]);else groups[key].addTo(map);};
post({type:'ready'});
</script></body></html>`;
}
function makePointFeature(lat: unknown, lng: unknown, properties: any) { const latitude=Number(lat); const longitude=Number(lng); if(!Number.isFinite(latitude)||!Number.isFinite(longitude)) return null; return { type:'Feature', geometry:{type:'Point',coordinates:[longitude,latitude]}, properties }; }
function getImovelLocation(item: any) { const candidates=[[item.latitude,item.longitude],[item.face_latitude,item.face_longitude],[item.quarteirao_latitude,item.quarteirao_longitude]]; const location=candidates.map(([latitude,longitude])=>[Number(latitude),Number(longitude)]).find(([latitude,longitude])=>Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude!==0&&longitude!==0); return location ? { latitude: location[0], longitude: location[1] } : null; }
function buildQuarteiroesMap(rows: any[]): FeatureCollection {
  const features: any[] = [];
  rows.forEach((row) => {
    let geometry: any = null;
    try {
      const value = typeof row.poligono_geojson === 'string' ? JSON.parse(row.poligono_geojson) : row.poligono_geojson;
      geometry = value?.type === 'Feature' ? value.geometry : value;
    } catch {
      geometry = null;
    }

    if (geometry?.type && Array.isArray(geometry.coordinates)) {
      features.push({
        type: 'Feature',
        id: `polygon-${row.id_quadra}`,
        geometry,
        properties: {
          id: row.id_quadra,
          nome: row.nome_quadra,
          numero: row.numero_quadra,
          zona: row.nome_zona || 'Sem zona',
          localidade: row.nome_localidade || 'Sem localidade',
          color: row.cor_poligono || '#3388ff',
          type: 'polygon',
        },
      });
    }

    const latitude = Number(row.latitude_quadra);
    const longitude = Number(row.longitude_quadra);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      features.push({
        type: 'Feature',
        id: `point-${row.id_quadra}`,
        geometry: { type: 'Point', coordinates: [longitude, latitude] },
        properties: {
          id: row.id_quadra,
          nome: row.nome_quadra,
          numero: row.numero_quadra,
          zona: row.nome_zona || 'Sem zona',
          localidade: row.nome_localidade || 'Sem localidade',
          color: row.cor_poligono || '#3388ff',
          type: 'point',
        },
      });
    }
  });
  return { type: 'FeatureCollection', features };
}
function groupedFeatures(rows: any[], nameKey: string, latKey: string, lngKey: string, color: string) { const groups=new Map<string,{lat:number;lng:number;count:number}>(); rows.forEach(row=>{const name=row[nameKey]||'Sem nome';const lat=Number(row[latKey]);const lng=Number(row[lngKey]);if(!Number.isFinite(lat)||!Number.isFinite(lng))return;const old=groups.get(name)||{lat:0,lng:0,count:0};groups.set(name,{lat:old.lat+lat,lng:old.lng+lng,count:old.count+1});});return Array.from(groups,([name,value])=>makePointFeature(value.lat/value.count,value.lng/value.count,{name,title:name,subtitle:`${value.count} quarteirão(ões)`,color})).filter(Boolean); }
function groupedPolygons(mapData: FeatureCollection, groupKey: 'zona' | 'localidade', color: string) { return mapData.features.filter(feature=>feature.geometry?.type==='Polygon'||feature.geometry?.type==='MultiPolygon').map(feature=>{const name=feature.properties?.[groupKey]||'Sem nome';return {...feature,properties:{...feature.properties,title:name,subtitle:groupKey==='zona'?'Zona':'Localidade',color}}}); }

const MapaQuarteiroes: React.FC = () => {
  const navigation=useNavigation(); const { colors }=useTheme(); const webRef=useRef<WebView>(null);
  const [loading,setLoading]=useState(true); const [cacheLoaded,setCacheLoaded]=useState(false); const [enabledLayers,setEnabledLayers]=useState<Record<LayerKey,boolean>>({municipal:true,zonas:true,localidades:true,quarteiroes:true,faces:true,imoveis:true,pontos:true}); const [selectedLabel,setSelectedLabel]=useState(''); const [stats,setStats]=useState(defaultStats);
  const [layers,setLayers]=useState<Record<LayerKey,FeatureCollection>>({municipal:EMPTY_GEO,zonas:EMPTY_GEO,localidades:EMPTY_GEO,quarteiroes:EMPTY_GEO,faces:EMPTY_GEO,imoveis:EMPTY_GEO,pontos:EMPTY_GEO});
  const displayedLayers=useMemo<Record<LayerKey,FeatureCollection>>(()=>({...layers,zonas:{type:'FeatureCollection',features:groupedPolygons(layers.quarteiroes,'zona','#7b1fa2')},localidades:{type:'FeatureCollection',features:groupedPolygons(layers.quarteiroes,'localidade','#00897b')}}),[layers]);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const html=useMemo(()=>buildMapHtml(displayedLayers, mapCenter),[displayedLayers, mapCenter]);
  useEffect(()=>{listPontosLocais().then(pontos=>{const features=pontos.map(ponto=>makePointFeature(ponto.latitude,ponto.longitude,{title:ponto.descricao||'Ponto de referência',subtitle:'Pendente de sincronização',color:'#C2410C'})).filter(Boolean);setLayers(current=>({...current,pontos:{type:'FeatureCollection',features}}));}).catch(()=>{});},[layers.quarteiroes]);
  const load=useCallback(async()=>{setLoading(true);setSelectedLabel('');try{const apiUrl=getApiUrlForDisplay();const headers=authService.getAuthHeaders();const results=await Promise.allSettled([fetch(`${apiUrl}/stats`,{headers}).then(response=>{if(!response.ok)throw new Error(`Estatísticas (${response.status})`);return response.json()}),zonaService.list(),localidadeService.list(),quarteiraoService.list(),imovelService.list(),faceService.getMap()]);const [statsResult,zonasResult,localidadesResult,quarteiroesResult,imoveisResult,facesResult]=results;if(quarteiroesResult.status==='rejected')throw new Error(`Quarteirões: ${quarteiroesResult.reason?.message||'não foi possível consultar a API'}`);const statsResponse=statsResult.status==='fulfilled'?statsResult.value:{};const zonas=zonasResult.status==='fulfilled'?zonasResult.value:[];const localidades=localidadesResult.status==='fulfilled'?localidadesResult.value:[];const quarteiroes=quarteiroesResult.value;const imoveis=imoveisResult.status==='fulfilled'?imoveisResult.value:[];const facesMap=facesResult.status==='fulfilled'?facesResult.value:EMPTY_GEO;setMapCenter(findMapCenter(localidades,quarteiroes));const counts={zonas:zonas.length,localidades:localidades.length,quarteiroes:Number(statsResponse.quarteiroes||quarteiroes.length),faces:Number(statsResponse.faces||0),imoveis:Number(statsResponse.imoveis||imoveis.length)};setStats({...counts,total:Object.values(counts).reduce((sum,value)=>sum+value,0)});const imovelFeatures=imoveis.map((item:any)=>{const tipo=String(item.tipo||'Outro');const normalized=tipo.toLowerCase();const color=normalized.includes('resid')?'#2f80ed':normalized.includes('comerc')?'#e67e22':normalized.includes('terreno')||normalized.includes('baldio')?'#27ae60':'#8e44ad';const location=getImovelLocation(item);return makePointFeature(location?.latitude,location?.longitude,{id:item.id_imovel,title:`${item.nome_logradouro||'Imóvel'}, ${item.numero||'S/N'}`,subtitle:'Imóvel cadastrado',tipo,color});}).filter(Boolean);setLayers({municipal:EMPTY_GEO,zonas:{type:'FeatureCollection',features:groupedFeatures(quarteiroes,'nome_zona','latitude_quadra','longitude_quadra','#8e44ad')},localidades:{type:'FeatureCollection',features:groupedFeatures(quarteiroes,'nome_localidade','latitude_quadra','longitude_quadra','#16a085')},quarteiroes:buildQuarteiroesMap(quarteiroes),faces:facesMap||EMPTY_GEO,imoveis:{type:'FeatureCollection',features:imovelFeatures},pontos:EMPTY_GEO});}catch(error:any){Alert.alert('Meu mapa de campo',error?.message||'Não foi possível carregar os dados do mapa.');}finally{setLoading(false);}},[]);
  useEffect(()=>{if(cacheLoaded)load();},[cacheLoaded,load]);
  useEffect(()=>{if(cacheLoaded)AsyncStorage.setItem(MAP_CACHE_KEY,JSON.stringify({layers,stats})).catch(()=>{});},[cacheLoaded,layers,stats]);
  useEffect(()=>{AsyncStorage.getItem(MAP_CACHE_KEY).then(value=>{if(value){const cached=JSON.parse(value);if(cached.layers)setLayers(cached.layers);if(cached.stats)setStats(cached.stats);}}).catch(()=>{}).finally(()=>setCacheLoaded(true));},[]);
  const toggleLayer=(key:LayerKey)=>{setEnabledLayers(current=>({...current,[key]:!current[key]}));webRef.current?.injectJavaScript(`toggleLayer(${JSON.stringify(key)});true;`);};
  const onMessage=useCallback((event:WebViewMessageEvent)=>{try{const message=JSON.parse(event.nativeEvent.data);if(message.type==='feature_click')setSelectedLabel(`Selecionado: ${message.label}`);if(message.type==='notice')setSelectedLabel(message.message);if(message.type==='error')Alert.alert('Meu mapa de campo',message.message);}catch{}},[]);
  const cards=[['Zonas',stats.zonas,'map-marker-alt','#8e44ad'],['Localidades',stats.localidades,'city','#16a085'],['Quarteirões',stats.quarteiroes,'th','#2f80ed'],['Faces',stats.faces,'road','#f39c12'],['Imóveis',stats.imoveis,'home','#d35400'],['Total geral',stats.total,'layer-group',colors.primary]] as const;
  return <SafeAreaView style={[styles.safe,{backgroundColor:colors.background}]}><View style={[styles.header,{backgroundColor:colors.card,borderBottomColor:colors.border}]}><TouchableOpacity onPress={()=>navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.text}/></TouchableOpacity><View style={styles.titleWrap}><Text style={[styles.title,{color:colors.text}]}>Meu mapa de campo</Text>{!!selectedLabel&&<Text style={[styles.selected,{color:colors.textSecondary}]} numberOfLines={1}>{selectedLabel}</Text>}</View><TouchableOpacity onPress={load} disabled={loading} style={styles.refresh}>{loading?<ActivityIndicator size="small" color={colors.primary}/>:<Ionicons name="refresh" size={21} color={colors.primary}/>}</TouchableOpacity></View><View style={styles.cards}>{cards.map(([label,value,icon,color])=><View key={label} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><FontAwesome5 name={icon} size={14} color={color}/><Text style={[styles.cardValue,{color:colors.text}]}>{value}</Text><Text style={[styles.cardLabel,{color:colors.textSecondary}]} numberOfLines={1}>{label}</Text></View>)}</View><View style={styles.controls}><Text style={[styles.controlTitle,{color:colors.text}]}>Controle do mapa</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{LAYERS.map(layer=><TouchableOpacity key={layer.key} onPress={()=>toggleLayer(layer.key)} style={[styles.filter,{borderColor:enabledLayers[layer.key]?colors.primary:colors.border,backgroundColor:enabledLayers[layer.key]?colors.primary:colors.card,opacity:enabledLayers[layer.key]?1:.65}]}><FontAwesome5 name={layer.icon} size={13} color={enabledLayers[layer.key]?'#fff':colors.text}/><Text style={{color:enabledLayers[layer.key]?'#fff':colors.text,fontWeight:'700',fontSize:12}}>{layer.label}</Text></TouchableOpacity>)}</ScrollView></View><View style={styles.mapWrap}>{loading?<View style={styles.loading}><ActivityIndicator size="large" color={colors.primary}/><Text style={{marginTop:10,color:colors.textSecondary}}>Carregando mapa...</Text></View>:<WebView ref={webRef} originWhitelist={['*']} source={{html}} javaScriptEnabled domStorageEnabled onMessage={onMessage} setSupportMultipleWindows={false}/>}</View></SafeAreaView>;
};
const styles=StyleSheet.create({safe:{flex:1},header:{minHeight:62,paddingHorizontal:12,flexDirection:'row',alignItems:'center',borderBottomWidth:1},back:{padding:8},refresh:{padding:10},titleWrap:{flex:1,marginHorizontal:8},title:{fontSize:19,fontWeight:'800'},selected:{fontSize:11,marginTop:2},cards:{flexDirection:'row',padding:8,gap:5},card:{flex:1,minHeight:78,borderRadius:8,borderWidth:1,padding:7,justifyContent:'space-between'},cardValue:{fontSize:19,fontWeight:'800'},cardLabel:{fontSize:10,fontWeight:'600'},controls:{paddingHorizontal:12,paddingBottom:10},controlTitle:{fontSize:15,fontWeight:'800',marginBottom:8},filters:{gap:8},filter:{minHeight:38,paddingHorizontal:11,borderRadius:8,borderWidth:1,flexDirection:'row',alignItems:'center',gap:7},mapWrap:{flex:1,overflow:'hidden'},loading:{flex:1,alignItems:'center',justifyContent:'center'}});
export default MapaQuarteiroes;
