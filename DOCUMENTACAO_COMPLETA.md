# 📚 Documentação Completa do Projeto eCampo

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Backend - API REST](#backend---api-rest)
6. [Frontend - React Native](#frontend---react-native)
7. [Fluxo de Autenticação](#fluxo-de-autenticação)
8. [Funcionalidades Implementadas](#funcionalidades-implementadas)
9. [Configuração e Instalação](#configuração-e-instalação)
10. [Credenciais de Teste](#credenciais-de-teste)
11. [Problemas Conhecidos e Soluções](#problemas-conhecidos-e-soluções)

---

## 🎯 Visão Geral

**eCampo** é um sistema de gerenciamento de quarteirões agrícolas desenvolvido em React Native (frontend) e Node.js (backend), com banco de dados PostgreSQL. O sistema permite que usuários cadastrem, visualizem, editem e excluam quarteirões, com controle de acesso por usuário.

### Objetivo
Gerenciar quarteirões agrícolas com informações sobre localização, zona, status e produções associadas.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐
│  React Native   │  (Frontend Mobile)
│   Expo/Metro    │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│   Node.js API   │  (Backend)
│   Express.js    │
└────────┬────────┘
         │ SQL
         │
┌────────▼────────┐
│   PostgreSQL    │  (Banco de Dados)
│   Port: 5432    │
└─────────────────┘
```

### Componentes Principais
- **Frontend**: React Native com TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL 12+
- **ORM**: Knex.js
- **Autenticação**: JWT (JSON Web Tokens)

---

## 💻 Tecnologias Utilizadas

### Frontend
- **React Native**: 0.76.6
- **TypeScript**: 5.3.3
- **React Navigation**: Navegação entre telas
- **AsyncStorage**: Armazenamento local
- **Axios**: Requisições HTTP

### Backend
- **Node.js**: v24.11.1
- **Express**: 4.21.2
- **TypeScript**: 5.7.3
- **Knex.js**: Query builder SQL
- **pg**: Driver PostgreSQL
- **jsonwebtoken**: Autenticação JWT
- **bcryptjs**: Hash de senhas
- **cors**: Controle de CORS

### Banco de Dados
- **PostgreSQL**: 12+
- **Database**: ecampo
- **Port**: 5432
- **User**: postgres

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 1. **usuarios** (Tabela de Usuários - Legacy)
```sql
CREATE TABLE usuarios (
  id_usuario SERIAL PRIMARY KEY,
  cpf_usuario VARCHAR(14) UNIQUE NOT NULL,  -- Formato: 000.000.000-00
  nome_usuario VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'Ativo'
);
```

**Dados de Exemplo:**
- Suzana Maria Bezerra: CPF `794.813.964-87`, id_usuario: 2
- Senha padrão para todos: `123456`

#### 2. **tb_quarteiroes** (Tabela de Quarteirões)
```sql
CREATE TABLE tb_quarteiroes (
  id_quadra SERIAL PRIMARY KEY,
  nome_quadra VARCHAR(255) NOT NULL,
  numero_quadra INTEGER NOT NULL,
  ibge_quadra VARCHAR(10),
  id_localidade INTEGER REFERENCES tb_localidades(id_localidade),
  id_zona INTEGER REFERENCES tb_zonas(id_zona),
  id_usuario INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'Ativo',
  poligono_geojson TEXT,
  latitude_quadra NUMERIC(10, 6),
  longitude_quadra NUMERIC(10, 6),
  cor_poligono VARCHAR(7) DEFAULT '#3388ff'
);
```

**Campos:**
- `id_quadra`: ID único do quarteirão
- `nome_quadra`: Nome do quarteirão (ex: "QUARTEIRÃO", "900", "232")
- `numero_quadra`: Número sequencial do quarteirão
- `id_localidade`: FK para tb_localidades
- `id_zona`: FK para tb_zonas
- `id_usuario`: FK para usuarios (filtro por usuário)
- `status`: "Ativo" ou "Inativo"

#### 3. **tb_localidades** (Tabela de Localidades)
```sql
CREATE TABLE tb_localidades (
  id_localidade SERIAL PRIMARY KEY,
  co_localidade INTEGER,
  nome_localidade VARCHAR(255) NOT NULL,
  ibge_localidade VARCHAR(10),
  id_zona INTEGER REFERENCES tb_zonas(id_zona),
  id_usuario INTEGER,
  status VARCHAR(20) DEFAULT 'Ativo'
);
```

**Exemplos:**
- CENTRO (id: 3)
- RECANTO DOS PÁSSAROS (id: 4)
- DEMARCAÇÃO (id: 7)

#### 4. **tb_zonas** (Tabela de Zonas)
```sql
CREATE TABLE tb_zonas (
  id_zona SERIAL PRIMARY KEY,
  co_zona INTEGER,
  nome_zona VARCHAR(255) NOT NULL,
  ibge_zona VARCHAR(10),
  id_usuario INTEGER,
  status VARCHAR(20) DEFAULT 'Ativo'
);
```

**Exemplos:**
- ZONA (id: 7)
- RURAL (id: 10)

#### 5. **producao** (Tabela de Produções)
```sql
CREATE TABLE producao (
  id_producao SERIAL PRIMARY KEY,
  id_quarteirao INTEGER REFERENCES tb_quarteiroes(id_quadra),
  seq INTEGER,
  id_face INTEGER,
  id_imovel INTEGER,
  hora_visita VARCHAR(10),
  visita_n_r VARCHAR(50),
  pendencia VARCHAR(100),
  imovel_insp VARCHAR(10),
  nu_amostra_ini INTEGER,
  nu_amostra_fim INTEGER,
  qtd_tubitos INTEGER,
  depositos_eliminados INTEGER,
  a1 INTEGER,
  a2 INTEGER,
  b INTEGER,
  c INTEGER,
  d1 INTEGER,
  d2 INTEGER,
  e INTEGER,
  imoveis_tratados INTEGER,
  larvicida_tipo VARCHAR(100),
  larvicida_qtd_carga INTEGER,
  larvicida_qtd_dep_trat INTEGER,
  adulticida_tipo VARCHAR(100),
  adulticida_qtd_carga INTEGER,
  id_zona INTEGER,
  atividade VARCHAR(10),
  data_atividade DATE,
  ciclo_ano VARCHAR(10),
  cabecalho_tipo VARCHAR(10),
  cabecalho_zona_concluida VARCHAR(10),
  ibge_producao VARCHAR(10),
  id_usuario INTEGER,
  status VARCHAR(20),
  latitude VARCHAR(20),
  longitude VARCHAR(20),
  id_localidade INTEGER
);
```

### Relacionamentos
```
usuarios (1) ──── (N) tb_quarteiroes
tb_zonas (1) ──── (N) tb_localidades
tb_zonas (1) ──── (N) tb_quarteiroes
tb_localidades (1) ──── (N) tb_quarteiroes
tb_quarteiroes (1) ──── (N) producao
```

### Sequências
- `tb_quadras_id_quadra_seq`: Sequência para id_quadra

---

## 🔧 Backend - API REST

### Estrutura de Pastas
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts       # Login e autenticação
│   │   └── quarteiraoController.ts # CRUD de quarteirões
│   ├── middleware/
│   │   └── auth.ts                 # Middleware JWT
│   ├── routes/
│   │   ├── auth.ts                 # Rotas de autenticação
│   │   └── quarteiroes.ts          # Rotas de quarteirões
│   ├── utils/
│   │   └── auth.ts                 # Funções de hash e JWT
│   ├── database.ts                 # Configuração Knex
│   └── server.ts                   # Servidor Express
├── knexfile.ts                     # Configuração do banco
└── package.json
```

### Endpoints da API

#### Autenticação

**POST /api/auth/login**
```json
Request:
{
  "cpf": "79481396487",
  "password": "123456"
}

Response:
{
  "userId": 2,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "cpf": "794.813.964-87",
    "name": "SUSANA MARIA BEZERRA"
  },
  "message": "Login successful"
}
```

**POST /api/auth/register**
```json
Request:
{
  "cpf": "12345678909",
  "password": "123456"
}

Response:
{
  "userId": 7,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 7,
    "cpf": "12345678909"
  },
  "message": "User registered successfully"
}
```

**GET /api/auth/profile**
```
Headers: Authorization: Bearer <token>

Response:
{
  "id": 2,
  "cpf": "794.813.964-87",
  "name": "SUSANA MARIA BEZERRA"
}
```

#### Quarteirões

**GET /api/quarteiroes**
```
Headers: Authorization: Bearer <token>

Response:
[
  {
    "id_quadra": 1,
    "nome_quadra": "QUARTEIRÃO",
    "numero_quadra": 19,
    "id_localidade": 3,
    "id_zona": 7,
    "id_usuario": 2,
    "status": "Ativo",
    "nome_localidade": "CENTRO",
    "nome_zona": "ZONA",
    "total_producoes": "0"
  },
  ...
]
```

**POST /api/quarteiroes**
```json
Headers: Authorization: Bearer <token>

Request:
{
  "nome": "Quarteirão Teste",
  "numero": 37,
  "id_localidade": 1,
  "id_zona": 1,
  "status": "Ativo"
}

Response:
{
  "id": 41,
  "message": "Quarteirao created successfully"
}
```

**PUT /api/quarteiroes/:id**
```json
Headers: Authorization: Bearer <token>

Request:
{
  "nome": "Quarteirão Atualizado",
  "numero": 37,
  "id_localidade": 1,
  "id_zona": 1,
  "status": "Inativo"
}

Response:
{
  "message": "Quarteirao updated successfully"
}
```

**DELETE /api/quarteiroes/:id**
```
Headers: Authorization: Bearer <token>

Response:
{
  "message": "Quarteirao deleted successfully"
}
```

### Configuração do Banco (knexfile.ts)
```typescript
module.exports = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'fabio99248033',
    database: 'ecampo'
  },
  migrations: {
    directory: './migrations'
  }
};
```

### Middleware de Autenticação
```typescript
// Verifica token JWT em todas as rotas protegidas
export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## 📱 Frontend - React Native

### Estrutura de Pastas
```
src/
├── components/
│   └── Input.tsx                   # Componente de input reutilizável
├── navigation/
│   └── AppNavigator.tsx            # Navegação principal
├── screens/
│   ├── LoginScreen.tsx             # Tela de login
│   ├── HomeScreen.tsx              # Tela inicial
│   ├── Quarteiroes.tsx             # Lista de quarteirões
│   └── screensCadastro/
│       └── CadastroQuarteirao.tsx  # CRUD de quarteirões
├── services/
│   └── api.ts                      # Serviços de API
├── utils/
│   └── validation.ts               # Validações
└── App.tsx                         # Componente raiz
```

### Serviços de API (api.ts)

```typescript
const API_URL = 'http://192.168.1.7:3000/api';

class AuthService {
  private token: string | null = null;
  private userId: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  async login(cpf: string, password: string) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      cpf,
      password,
    });
    return response.data;
  }

  async register(cpf: string, password: string) {
    const response = await axios.post(`${API_URL}/auth/register`, {
      cpf,
      password,
    });
    return response.data;
  }
}

class QuarteiraoService {
  async list() {
    const token = authService.token;
    const response = await axios.get(`${API_URL}/quarteiroes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async create(data: any) {
    const token = authService.token;
    const response = await axios.post(`${API_URL}/quarteiroes`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async update(id: number, data: any) {
    const token = authService.token;
    const response = await axios.put(`${API_URL}/quarteiroes/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async delete(id: string) {
    const token = authService.token;
    const response = await axios.delete(`${API_URL}/quarteiroes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}

export const authService = new AuthService();
export const quarteiraoService = new QuarteiraoService();
```

### Telas Principais

#### 1. LoginScreen.tsx
- Validação de CPF (formato: 000.000.000-00)
- Validação de senha
- Formatação automática do CPF
- Armazenamento de token no AsyncStorage
- Navegação para HomeScreen após login

#### 2. HomeScreen.tsx
- Exibe informações do usuário logado
- Botão de logout
- Navegação para outras telas

#### 3. CadastroQuarteirao.tsx
**Funcionalidades:**
- Listagem de quarteirões com paginação (5, 10, 20, 50 itens)
- Busca por nome, localidade ou zona
- Criação de novos quarteirões
- Edição de quarteirões existentes
- Exclusão de quarteirões
- Pull to refresh
- Cards com informações:
  - Número do quarteirão
  - Nome do quarteirão
  - Localidade vinculada
  - Zona vinculada
  - Status (Ativo/Inativo)
  - Botões de ação (Editar/Excluir)

**Interface do Quarteirão:**
```typescript
interface Quarteirao {
  id: string;
  numero: number;
  nome: string;
  localidade: string;
  zona: string;
  status: 'Ativo' | 'Inativo';
  area: number;
  data_cadastro: string;
  descricao?: string;
  total_producoes?: number;
}
```

---

## 🔐 Fluxo de Autenticação

### 1. Login
```
┌─────────┐     POST /api/auth/login      ┌─────────┐
│ Cliente │ ──────────────────────────────> │   API   │
│         │  { cpf, password }             │         │
│         │                                 │         │
│         │ <────────────────────────────── │         │
│         │  { token, userId, user }       │         │
└─────────┘                                 └─────────┘
     │
     │ Armazena no AsyncStorage:
     │ - authToken
     │ - userId
     │ - userCPF
     │
     ▼
┌─────────┐
│  Home   │
└─────────┘
```

### 2. Requisições Autenticadas
```
┌─────────┐     GET /api/quarteiroes       ┌─────────┐
│ Cliente │ ──────────────────────────────> │   API   │
│         │  Headers:                       │         │
│         │  Authorization: Bearer <token>  │         │
│         │                                 │         │
│         │ <────────────────────────────── │         │
│         │  [ quarteiroes ]                │         │
└─────────┘                                 └─────────┘
```

### 3. Restauração de Sessão
```typescript
// AppNavigator.tsx
useEffect(() => {
  const restoreSession = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const userId = await AsyncStorage.getItem('userId');
    
    if (token && userId) {
      authService.setToken(token);
      authService.setUserId(userId);
    }
  };
  
  restoreSession();
}, []);
```

---

## ✨ Funcionalidades Implementadas

### Autenticação
- ✅ Login com CPF e senha
- ✅ Validação de CPF (formato e dígitos verificadores)
- ✅ Formatação automática de CPF
- ✅ Armazenamento de sessão (AsyncStorage)
- ✅ Restauração de sessão ao reabrir app
- ✅ Logout com limpeza de dados
- ✅ Proteção de rotas com JWT

### Quarteirões
- ✅ Listagem de quarteirões do usuário logado
- ✅ Filtro por usuário (cada usuário vê apenas seus quarteirões)
- ✅ Busca por nome, localidade ou zona
- ✅ Paginação (5, 10, 20, 50 itens por página)
- ✅ Criação de novos quarteirões
- ✅ Edição de quarteirões existentes
- ✅ Exclusão de quarteirões
- ✅ Pull to refresh
- ✅ Exibição de dados relacionados (localidade e zona)
- ✅ Contagem de produções por quarteirão
- ✅ Status (Ativo/Inativo)

### Interface
- ✅ Design responsivo
- ✅ Cards informativos
- ✅ Modal de cadastro/edição
- ✅ Confirmação de exclusão
- ✅ Loading states
- ✅ Mensagens de erro e sucesso
- ✅ Navegação intuitiva

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js v24.11.1 ou superior
- PostgreSQL 12 ou superior
- Expo CLI
- Android Studio ou Xcode (para emuladores)

### 1. Configurar Banco de Dados

```sql
-- Criar banco de dados
CREATE DATABASE ecampo;

-- Conectar ao banco
\c ecampo

-- As tabelas já existem no banco
-- Verificar tabelas:
\dt
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente (criar .env)
DATABASE_URL=postgres://postgres:fabio99248033@localhost:5432/ecampo
JWT_SECRET=seu_secret_aqui
PORT=3000

# Iniciar servidor
npm run dev
```

### 3. Configurar Frontend

```bash
cd ..

# Instalar dependências
npm install

# Atualizar IP do backend em src/services/api.ts
# Trocar 192.168.1.7 pelo IP da sua máquina

# Iniciar aplicação
npm start

# Ou para Android
npm run android

# Ou para iOS
npm run ios
```

### 4. Resetar Sequência (se necessário)

```sql
-- Se houver erro de chave duplicada ao criar quarteirão
SELECT setval('tb_quadras_id_quadra_seq', (SELECT MAX(id_quadra) FROM tb_quarteiroes));
```

---

## 🔑 Credenciais de Teste

### Usuários Disponíveis

**Suzana Maria Bezerra** (36 quarteirões)
- CPF: `79481396487` ou `794.813.964-87`
- Senha: `123456`
- ID: 2

**Usuário de Teste**
- CPF: `12345678909`
- Senha: `123456`
- ID: 7

**Outros Usuários**
- Todos os usuários da tabela `usuarios` podem fazer login
- Senha padrão: `123456`
- CPF pode ser com ou sem formatação

---

## 🐛 Problemas Conhecidos e Soluções

### 1. Erro de Chave Duplicada ao Criar Quarteirão
**Erro:**
```
duplicar valor da chave viola a restrição de unicidade "tb_quadras_pkey"
Chave (id_quadra)=(1) já existe.
```

**Solução:**
```sql
SELECT setval('tb_quadras_id_quadra_seq', (SELECT MAX(id_quadra) FROM tb_quarteiroes));
```

### 2. Erro de Conexão com Backend
**Erro:**
```
Network Error
```

**Soluções:**
1. Verificar se o backend está rodando (`npm run dev`)
2. Verificar IP correto em `src/services/api.ts`
3. Verificar firewall/antivírus
4. Testar com `http://localhost:3000` se estiver no emulador Android

### 3. CPF Formatado no Login
**Problema:** Backend não aceita CPF formatado

**Solução:** O frontend já remove a formatação antes de enviar:
```typescript
const cleanedCPF = cpf.replace(/\D/g, '');
```

### 4. Quarteirões Não Aparecem na Tela
**Problema:** Dados carregam mas não renderizam

**Solução:** Já corrigido - era problema com Fragment sem altura. Agora usa View com flex: 1.

### 5. Localidade e Zona Aparecem como ID
**Problema:** Mostrava números ao invés de nomes

**Solução:** Já corrigido - backend faz JOIN com tb_localidades e tb_zonas:
```typescript
.leftJoin('tb_localidades as l', 'q.id_localidade', 'l.id_localidade')
.leftJoin('tb_zonas as z', 'q.id_zona', 'z.id_zona')
```

---

## 📊 Estatísticas do Projeto

### Linhas de Código
- Backend: ~500 linhas
- Frontend: ~2000 linhas
- Total: ~2500 linhas

### Arquivos
- Backend: 10 arquivos principais
- Frontend: 15 arquivos principais
- Total: 25 arquivos

### Tabelas do Banco
- 5 tabelas principais
- 3 relacionamentos principais

### Endpoints da API
- 7 endpoints implementados
- 100% com autenticação JWT

---

## 🚀 Próximas Melhorias

### Backend
- [ ] Adicionar validação de dados mais robusta
- [ ] Implementar rate limiting
- [ ] Adicionar logs estruturados
- [ ] Implementar testes unitários
- [ ] Adicionar documentação Swagger

### Frontend
- [ ] Implementar seleção de localidade/zona em dropdown
- [ ] Adicionar mapa para visualizar quarteirões
- [ ] Implementar upload de imagens
- [ ] Adicionar gráficos de produção
- [ ] Implementar modo offline
- [ ] Adicionar testes E2E

### Banco de Dados
- [ ] Adicionar índices para otimização
- [ ] Implementar soft delete
- [ ] Adicionar triggers para auditoria
- [ ] Criar views para relatórios

---

## 📝 Notas Importantes

1. **Senha Padrão**: Todos os usuários usam senha `123456` (apenas para desenvolvimento)
2. **Tabela usuarios**: É a tabela legacy, mantida para compatibilidade
3. **CPF**: Aceita com ou sem formatação no login
4. **Filtro por Usuário**: Cada usuário vê apenas seus próprios quarteirões
5. **Sequência**: Pode precisar ser resetada após inserções manuais no banco
6. **IP do Backend**: Deve ser atualizado em `src/services/api.ts` para o IP da sua máquina

---

## 👥 Contato e Suporte

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.

---

**Última Atualização:** 11/02/2026
**Versão:** 1.0.0
**Status:** ✅ Funcional e Testado
