# Mapa Mobile — Quarteirão (Leaflet via WebView)

## Como funciona

O componente `QuarteiraoMapWebView` renderiza um HTML completo com **Leaflet 1.9.4** + **Leaflet.draw 1.0.4** dentro de um `react-native-webview`. Toda a lógica de mapa roda no contexto web isolado; a comunicação com o React Native é feita via `postMessage` / `injectJavaScript`.

```
RN → WebView : injectJavaScript("handleCommand({type, payload})")
WebView → RN : window.ReactNativeWebView.postMessage(JSON.stringify({type, payload}))
```

## Dependências

| Pacote | Versão | Observação |
|---|---|---|
| `react-native-webview` | 13.6.4 | já no projeto |
| `expo-location` | SDK 50 compat | instalado automaticamente |

CDNs carregadas no HTML (requer internet na primeira abertura):
- `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
- `https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js`

> **Offline total**: se o dispositivo nunca carregou o mapa, os tiles e scripts CDN não estarão disponíveis. Para suporte offline completo, faça bundle dos assets Leaflet localmente (ver seção abaixo).

## Uso básico

```tsx
import QuarteiraoMapWebView, {
  QuarteiraoMapHandle,
  MapPolygonData,
} from '../components/QuarteiraoMapWebView';

const mapRef = useRef<QuarteiraoMapHandle>(null);
const [mapData, setMapData] = useState<MapPolygonData | null>(null);

<QuarteiraoMapWebView
  ref={mapRef}
  initialPolygon={existingGeojson}   // null para novo cadastro
  onPolygonChanged={(data) => setMapData(data)}
  onReady={() => console.log('mapa pronto')}
  height={300}
/>

// Centralizar no GPS do usuário:
mapRef.current?.setCenter(lat, lng, 17);

// Carregar polígono salvo:
mapRef.current?.setPolygon(geojsonObject);
```

## Eventos emitidos pelo mapa

| Tipo | Payload | Quando |
|---|---|---|
| `MAP_READY` | `{}` | Mapa inicializado |
| `POLYGON_CHANGED` | `{ geojson, centroid, bounds, area_m2 }` ou `null` | Polígono criado/editado/apagado |
| `LOCATION_CHANGED` | `{ lat, lng }` | Marcador movido/criado |
| `ERROR` | `{ message }` | Geolocalização indisponível |

## Comandos enviados para o mapa (via ref)

| Método | Descrição |
|---|---|
| `setCenter(lat, lng, zoom?)` | Centraliza mapa e posiciona marcador |
| `setPolygon(geojson)` | Carrega polígono existente |
| `setMarker(lat, lng)` | Posiciona marcador sem mover o mapa |
| `injectJavaScript(js)` | Escape hatch para comandos customizados |

## Payload enviado ao backend

Ao salvar o quarteirão, o payload inclui:

```json
{
  "nome": "...",
  "numero": 1,
  "localidade_nome": "...",
  "zona_nome": "...",
  "status": "Ativo",
  "geojson": { "type": "Feature", "geometry": { ... } },
  "centroid_lat": -15.7801,
  "centroid_lng": -47.9292,
  "area_m2": 12345.67
}
```

O backend precisa aceitar e persistir esses campos. Adicione as colunas na tabela `tb_quarteiroes` se necessário:

```sql
ALTER TABLE tb_quarteiroes
  ADD COLUMN IF NOT EXISTS geojson JSONB,
  ADD COLUMN IF NOT EXISTS centroid_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS centroid_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS area_m2 DOUBLE PRECISION;
```

## Permissões

Já configuradas no `app.json`:
- Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- iOS: `NSLocationWhenInUseUsageDescription`

O componente solicita permissão via `expo-location` apenas quando o usuário clica em **"Detectar localização atual"**.

## Offline — armazenamento local

O polígono é incluído no payload do `quarteiraoLocalRepo.createLocal` / `updateLocal` automaticamente via `CadastroQuarteirao`. O `SyncService` já envia o payload completo (incluindo `geojson`) para o backend quando a conexão for restaurada.

## Bundle Leaflet offline (opcional)

Para funcionar sem internet, copie os arquivos para `assets/leaflet/` e substitua as URLs CDN no `buildHtml` por `file:///android_asset/...` (Android) ou bundle via `expo-asset`. Isso requer ejetar do Expo Go para um dev client.

## Manutenção

- **Atualizar Leaflet**: trocar a versão nas URLs CDN dentro de `buildHtml` em `QuarteiraoMapWebView.tsx`.
- **Estilo do polígono**: alterar `shapeOptions` no objeto `draw.polygon` dentro do HTML.
- **Tile layer**: trocar a URL do `L.tileLayer` para usar outro provedor (ex: Mapbox, Google).
