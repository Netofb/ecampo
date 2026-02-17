# Mapa + Street View (Opção A) — eCampo (Web + Mobile)

Este README descreve uma implementação **prática e simples** para adicionar **Mapa** ao sistema e abrir o **Google Street View** a partir de uma coordenada **(latitude/longitude)** usando a **Opção A**: **abrir no navegador** (deep link/URL), sem SDK de Street View dentro do app.

> Objetivo: o **Mobile** coleta/consulta dados (inclusive offline) e, quando o usuário quiser validar o local, toca em **“Abrir no Street View”** e o app abre o Street View no navegador no ponto exato.

---

## Sumário

- [1. Visão geral](#1-visão-geral)
- [2. Requisitos](#2-requisitos)
- [3. Modelo de dados](#3-modelo-de-dados)
- [4. Link do Street View (Opção A)](#4-link-do-street-view-opção-a)
- [5. UX sugerida](#5-ux-sugerida)
- [6. Web: Mapa + Street View (referência)](#6-web-mapa--street-view-referência)
- [7. Mobile: Mapa e botão “Abrir no Street View”](#7-mobile-mapa-e-botão-abrir-no-street-view)
- [8. Backend: endpoints recomendados](#8-backend-endpoints-recomendados)
- [9. Offline + sincronização (compatível)](#9-offline--sincronização-compatível)
- [10. Segurança, chaves e custos](#10-segurança-chaves-e-custos)
- [11. Checklist de implementação](#11-checklist-de-implementação)
- [12. Próximos upgrades (opcionais)](#12-próximos-upgrades-opcionais)

---

## 1. Visão geral

Você terá:

1) **Mapa no Mobile** (ex.: `react-native-maps`) mostrando:
- produções (pontos), quarteirões (pontos ou áreas no futuro)
- “pendente vs sincronizado” (se offline-first)

2) **Botão “Abrir no Street View”** em cada produção/quarteirão:
- abre o navegador com um link do Google (Street View / Maps com panorama)

3) **Web** continua sendo prioridade:
- se houver conflito de dados, resolve no Web
- o Street View é usado como verificação/auditoria

---

## 2. Requisitos

### Mobile
- React Native (ou Expo) com:
  - `Linking` do React Native para abrir URLs externas
  - (opcional) `react-native-maps` para exibir o mapa

### Web
- Você já usa Street View no Web.
- Recomenda-se também usar **Google Maps JavaScript API** se ainda não usa.

### Backend
- Node/Express + Postgres (Knex).
- Campos de coordenadas no banco (ver seção 3).

---

## 3. Modelo de dados

### 3.1. Produções (pontos)
Adicionar colunas (Postgres):

- `latitude DOUBLE PRECISION`
- `longitude DOUBLE PRECISION`
- `accuracy DOUBLE PRECISION` (opcional)
- `captured_at TIMESTAMP` (opcional)
- `location_source VARCHAR` (opcional: `gps|manual|imported`)

Exemplo de migração (conceito):

```sql
ALTER TABLE producoes
  ADD COLUMN latitude DOUBLE PRECISION,
  ADD COLUMN longitude DOUBLE PRECISION,
  ADD COLUMN accuracy DOUBLE PRECISION,
  ADD COLUMN captured_at TIMESTAMP,
  ADD COLUMN location_source VARCHAR(20);
```

> Se “Produção” ainda não existir como tabela, aplique isso na entidade que representa registros georreferenciáveis.

### 3.2. Quarteirões (futuro: polígonos)
Para começar simples:
- um **ponto central** (`centroid_lat`, `centroid_lng`)
Depois, se quiser áreas:
- `geojson JSONB` ou PostGIS `geometry`

---

## 4. Link do Street View (Opção A)

### 4.1. Formato mais simples (funciona bem)
Abra no navegador com:

- `https://www.google.com/maps?q=&layer=c&cbll=<LAT>,<LNG>`

Exemplo:
- `https://www.google.com/maps?q=&layer=c&cbll=-8.052240,-34.928609`

Em React Native:

```ts
import { Linking } from "react-native";

export function openStreetView(lat: number, lng: number) {
  const url = `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`;
  return Linking.openURL(url);
}
```

### 4.2. Alternativas úteis
**A)** Abrir Google Maps “modo street view” por URL (varia por plataforma):
- `google.streetview:cbll=<LAT>,<LNG>` (Android, se app Google Maps instalado)
- Recomendação: tente este primeiro e caia no `https://www.google.com/maps...`

**B)** Abrir Street View estático (thumbnail) — bom pra listas
- Street View Static API (gera imagem)
- Use no Web/Backend e mostre como preview (não interativo)

---

## 5. UX sugerida

### 5.1. Tela de mapa (Mobile)
- Marcadores de produções (pontos)
- Filtros:
  - por data, tipo, zona, usuário
- Ao tocar num marcador:
  - abrir um **Bottom Sheet/Card** com:
    - dados da produção
    - botão **“Abrir no Street View”**
    - (opcional) botão “Copiar coordenadas”

### 5.2. Tela de detalhes da produção
- Exibir:
  - coordenadas
  - precisão (`accuracy`)
  - data de captura
- Botão “Abrir no Street View”

### 5.3. Tratamento de ausência de coordenadas
Se `lat/lng` forem nulos:
- desabilitar botão e mostrar:
  - “Sem localização registrada”

---

## 6. Web: Mapa + Street View (referência)

Mesmo usando Opção A no mobile, no Web você pode manter/expandir:
- Mapa + Street View lado a lado (auditoria)
- Ao clicar em um item na tabela:
  - centraliza no mapa e abre panorama no Street View

Recomendação:
- Guardar no Web um botão “Abrir no Google Maps” com o mesmo link do mobile.

---

## 7. Mobile: Mapa e botão “Abrir no Street View”

### 7.1. Componentes
- `MapScreen`
- `ProductionMarkerCard`
- `StreetViewButton`

### 7.2. StreetViewButton (exemplo)
```tsx
import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { openStreetView } from "../utils/openStreetView";

export function StreetViewButton({ lat, lng }: { lat?: number; lng?: number }) {
  const disabled = typeof lat !== "number" || typeof lng !== "number";

  return (
    <TouchableOpacity
      onPress={() => !disabled && openStreetView(lat!, lng!)}
      disabled={disabled}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ fontWeight: "600" }}>Abrir no Street View</Text>
    </TouchableOpacity>
  );
}
```

### 7.3. Captura de coordenadas (quando criar/editar)
- Expo: `expo-location`
- RN CLI: `react-native-geolocation-service`

Armazene `lat/lng/accuracy` no registro local e sincronize depois.

---

## 8. Backend: endpoints recomendados

### 8.1. Buscar pontos para o mapa (por bbox)
Evite mandar tudo de uma vez.
Sugestão:

`GET /producoes/map?bbox=minLng,minLat,maxLng,maxLat&from=YYYY-MM-DD&to=YYYY-MM-DD`

Resposta:
```json
{
  "items": [
    {
      "id": 123,
      "latitude": -8.052240,
      "longitude": -34.928609,
      "updatedAt": "2026-02-12T12:00:00Z",
      "status": "ok"
    }
  ]
}
```

### 8.2. Atualizar produção com localização
`PATCH /producoes/:id/location`

Body:
```json
{
  "latitude": -8.052240,
  "longitude": -34.928609,
  "accuracy": 12.5,
  "capturedAt": "2026-02-12T12:00:00Z",
  "source": "gps"
}
```

### 8.3. Integração com sync offline-first
Se você já for implementar `/sync` (push/pull):
- inclua `latitude/longitude` no payload das produções
- no pull, retorne também esses campos

---

## 9. Offline + sincronização (compatível)

A Opção A (abrir URL) é independente do offline.

- Se offline:
  - o mapa pode continuar exibindo pontos do SQLite local
  - “Abrir Street View” depende de internet (navegador)
  - se não houver internet, mostrar:
    - “Conecte-se à internet para abrir o Street View”

Recomendação:
- No `sync gate` pós-login, após baixar produções, você já terá coordenadas locais.

---

## 10. Segurança, chaves e custos

### 10.1. Street View via URL (Opção A)
- **Não exige key** para abrir o Google Maps no navegador.
- Você evita expor chave no app só para Street View.

### 10.2. Quando você vai precisar de keys
- Web com Google Maps JS API: precisa de key (restrita por domínio)
- Mobile com Google Maps SDK (se for usar provider Google): precisa key (restrita por package/bundle)
- Geocoding/Places/Directions: precisa key e idealmente chamar via backend (onde possível)

### 10.3. Billing
- Google Maps Platform geralmente requer billing.
- Controle:
  - limite de requests
  - carregamento por bbox
  - cache no backend (para endpoints agregados)

---

## 11. Checklist de implementação

### Fase 1 — MVP (Street View Opção A)
- [ ] Adicionar `latitude/longitude` na entidade “produção” (ou equivalente)
- [ ] Ajustar telas de criação/edição para capturar GPS (opcional)
- [ ] MapScreen com markers (mesmo simples)
- [ ] Botão “Abrir no Street View” abrindo URL
- [ ] Mensagem clara quando sem coordenadas / sem internet

### Fase 2 — Performance
- [ ] Endpoint `/producoes/map` com bbox + filtros
- [ ] Cluster de marcadores
- [ ] Cache/limit no backend

### Fase 3 — Auditoria Web
- [ ] Link “Abrir no Street View” na tabela do web
- [ ] Mapa + Street View lado a lado (opcional)

---

## 12. Próximos upgrades (opcionais)

- **Street View Static API**: thumbnail em lista de produções
- **Reverse Geocoding**: salvar endereço legível
- **Quarteirões como polígonos**: GeoJSON/PostGIS
- **Rotas**: Directions API para rotas de visita
- **Validação automática**: “existe panorama próximo?” (via APIs Google — se você quiser)

---

## Snippet pronto (utilitário)
```ts
// src/utils/openStreetView.ts
import { Linking } from "react-native";

export async function openStreetView(lat: number, lng: number) {
  const webUrl = `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`;
  const canOpen = await Linking.canOpenURL(webUrl);
  if (!canOpen) throw new Error("Não foi possível abrir o navegador.");
  await Linking.openURL(webUrl);
}
```

---

Se você quiser, eu também posso:
- padronizar o endpoint `/producoes/map` no seu Express/Knex,
- e te passar o schema SQLite local alinhado com o sync offline-first.
