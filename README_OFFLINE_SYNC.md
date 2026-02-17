# Offline-first + Sincronização manual (server-wins) — Mobile eCampo

Este documento descreve a proposta de **funcionalidade offline** para o app mobile (React Native) com **sincronização manual** (botão “Sincronizar”), com **prioridade do sistema Web/Servidor**.  
Conflitos são tratados como **pendência** e devem ser resolvidos no **Web**.

---

## Objetivo

- Permitir uso do app **sem internet** (captura/edição local).
- Após login, baixar o **estado mais recente** (produções e dados base).
- Dentro do app, ter um **botão de sincronização** que faz:
  - **push**: envia alterações locais pendentes
  - **pull**: baixa alterações do servidor desde o último sync
- Política de conflitos: **server-wins** (o servidor manda).

---

## Princípios

1) **Servidor é a fonte da verdade**  
2) Mobile offline é “coletor”: salva local e registra operações (outbox)  
3) **Sem merge no mobile** (simplicidade)  
4) Conflito → mobile marca como `conflict` e orienta “resolver no Web”  
5) Sync é **idempotente** (operação não pode aplicar duas vezes)

---

## Fluxo de navegação (pós-login)

### Login → SyncGate → Home

1. Usuário faz login (JWT)
2. App navega para **SyncGateScreen**:
   - Baixa “últimas produções” e dados necessários
   - Salva no banco local
   - Atualiza `lastSyncToken`
3. Sucesso → navega para Home
4. Falha → opções:
   - “Tentar novamente”
   - “Entrar mesmo assim (offline)”

---

## Botão “Sincronizar” dentro do app

Ao clicar:

1. `pushOutbox()`: envia pendências locais (lote)
2. `pull()`: baixa atualizações do servidor desde `lastSyncToken`
3. Resultado exibido:
   - Enviados (applied)
   - Baixados (pulled)
   - Conflitos (resolver no Web)

---

## Estrutura local (mobile)

### Banco local recomendado
- **SQLite** (bom para dados relacionais como zona/localidade/joins)

### Tabelas sugeridas

#### `producoes` (espelho do servidor)
Campos típicos:
- `id` (serverId ou uuid local temporário)
- dados da produção
- `version` (int)
- `updatedAt`
- `deletedAt` (tombstone)
- `dirty` (boolean) — se tem alteração local não enviada
- `syncStatus` (`synced|pending|conflict|error`)

#### `outbox` (fila de operações)
Cada alteração offline vira um “commit”:

- `opId` (uuid) — **idempotência**
- `entity` (ex: `producao`)
- `entityId` (serverId ou uuid temp)
- `op` (`create|update|delete`)
- `payload` (JSON: patch ou snapshot)
- `baseVersion` (versão no momento da edição)
- `status` (`pending|sent|conflict|error`)
- `createdAt`

#### `meta`
- `lastSyncToken` (cursor/etag/timestamp)
- `clientId` (id do device)

---

## Estrutura no servidor (web/backend)

### Campos no registro (por entidade sincronizável)
- `version` (int incrementado a cada update)
- `updatedAt` (timestamp)
- `deletedAt` (timestamp ou null)

### Opcional (recomendado): idempotência
Tabela: `applied_ops`
- `opId`
- `userId`
- `appliedAt`

---

## Contrato de API (recomendado)

### Endpoint único: `POST /sync`

**Request**
```json
{
  "clientId": "uuid-do-device",
  "lastSyncToken": "cursor",
  "push": [
    {
      "opId": "uuid",
      "entity": "producao",
      "op": "update",
      "entityId": "123",
      "baseVersion": 7,
      "payload": { "campo": "valor" },
      "ts": "2026-02-12T12:00:00Z"
    }
  ]
}
```

**Response**
```json
{
  "ack": [
    { "opId": "uuid", "status": "applied", "newVersion": 8 }
  ],
  "conflicts": [
    {
      "opId": "uuid2",
      "entity": "producao",
      "entityId": "123",
      "serverVersion": 9,
      "server": { "estado": "atual" }
    }
  ],
  "pull": {
    "changes": [
      {
        "entity": "producao",
        "entityId": "555",
        "op": "update",
        "data": { "..." : "..." },
        "version": 3,
        "updatedAt": "2026-02-12T11:00:00Z"
      }
    ],
    "newSyncToken": "cursor_novo"
  }
}
```

---

## Regras de conflito (server-wins)

### Versionamento otimista (recomendado)
- Cliente envia `baseVersion`
- Servidor só aplica se `baseVersion == currentVersion`
- Se diferente → retorna **409 / conflict** (ou inclui em `conflicts[]`)
- Mobile marca outbox como `conflict` e mostra:
  - “Alterado no Web. Resolva no Web e sincronize novamente.”

### Opção extra no mobile (útil)
- “Descartar minha alteração local”
  - remove item da outbox (ou marca como ignored)
  - na próxima sincronização/pull, o servidor sobrescreve o local

---

## Criação offline (IDs)

Para criar registros offline:
- Mobile cria `clientGeneratedId` (UUID) como id temporário
- No push, servidor cria `id` real e devolve um `idMap`:
  - `{ "tempId": "uuid", "serverId": 123 }`
- Mobile substitui o id local e atualiza referências

---

## Implementação incremental (sem reescrever tudo)

### Fase 1
- SQLite + tabela `outbox`
- CRUD mobile grava local + outbox
- Botão sync implementa **push** apenas

### Fase 2
- Implementar **pull** com `lastSyncToken`
- Aplicar `pull.changes` no SQLite

### Fase 3
- Marcar conflitos e tela/lista “Pendências (resolver no Web)”
- Botão “Descartar local”

---

## Checklist de qualidade

- [ ] Token no Axios via interceptor
- [ ] Operações com `opId` (idempotência)
- [ ] `deletedAt` para deletes
- [ ] `version` e `baseVersion` para conflito
- [ ] `lastSyncToken` persistido
- [ ] UI de SyncGate + botão “Sincronizar”
- [ ] Mensagens claras para conflitos (resolver no Web)

---

## Resultado esperado

- Usuário entra → app baixa dados atuais (SyncGate)
- Offline funciona normalmente
- Ao sincronizar:
  - pendências são enviadas
  - novas mudanças do Web chegam
  - conflitos viram pendência e são resolvidos no Web
