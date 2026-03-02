# 🌾 eCampo - Sistema de Gerenciamento de Quarteirões Agrícolas

Sistema mobile desenvolvido em React Native para gerenciamento de quarteirões agrícolas, com backend em Node.js e banco de dados PostgreSQL.

## 📱 Screenshots

> Adicione screenshots do aplicativo aqui

## ✨ Funcionalidades

- 🔐 **Autenticação**: Login seguro com CPF e senha
- 📊 **Gestão de Quarteirões**: CRUD completo de quarteirões
- 🔍 **Busca e Filtros**: Busca por nome, localidade ou zona
- 📄 **Paginação**: Visualização de 5, 10, 20 ou 50 itens por página
- 🔄 **Sincronização**: Pull to refresh para atualizar dados
- 👤 **Multi-usuário**: Cada usuário vê apenas seus quarteirões
- 📍 **Localização**: Vinculação com localidades e zonas
- 📈 **Produções**: Contagem de produções por quarteirão

## 🛠️ Tecnologias

### Frontend
- React Native 0.76.6
- TypeScript 5.3.3
- React Navigation
- AsyncStorage
- Axios

### Backend
- Node.js v24.11.1
- Express 4.21.2
- TypeScript 5.7.3
- Knex.js (Query Builder)
- PostgreSQL
- JWT (Autenticação)
- bcryptjs (Hash de senhas)

## 📋 Pré-requisitos

- Node.js v24.11.1 ou superior
- PostgreSQL 12 ou superior
- Expo CLI
- Android Studio ou Xcode (para emuladores)

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/ecampo.git
cd ecampo
```

### 2. Configure o Banco de Dados

```sql
-- Criar banco de dados
CREATE DATABASE ecampo;

-- Conectar ao banco
\c ecampo

-- Importar estrutura do banco (se disponível)
-- ou criar as tabelas manualmente conforme documentação
```

### 3. Configure o Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# Editar .env com suas configurações
# DATABASE_URL=postgres://usuario:senha@localhost:5432/ecampo
# JWT_SECRET=seu_secret_aqui
# PORT=3000

# Iniciar servidor de desenvolvimento
npm run dev
```

O backend estará rodando em `http://localhost:3000`

### 4. Configure o Frontend

```bash
# Voltar para raiz do projeto
cd ..

# Instalar dependências
npm install

# Atualizar IP do backend em src/services/api.ts
# Trocar pelo IP da sua máquina local

# Iniciar aplicação
npm start

# Ou para Android
npm run android

# Ou para iOS
npm run ios
```

## Credenciais de Teste

**Importante:** Configure as senhas dos usuários no banco de dados usando hash bcrypt.

Para gerar hash de senha:
```bash
cd backend
npm run hash-password sua_senha_aqui
```

Depois atualize no banco:
```sql
UPDATE usuarios SET senha = '$2a$10$hash_gerado' WHERE cpf_usuario = 'CPF_DO_USUARIO';
```

## 📖 Documentação

Para documentação completa do projeto, incluindo:
- Estrutura do banco de dados
- Endpoints da API
- Fluxo de autenticação
- Arquitetura do sistema
- Problemas conhecidos e soluções

Consulte: [DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)

## 🗂️ Estrutura do Projeto

```
ecampo/
├── backend/                    # Backend Node.js
│   ├── src/
│   │   ├── controllers/       # Controladores da API
│   │   ├── middleware/        # Middlewares (auth, etc)
│   │   ├── routes/            # Rotas da API
│   │   ├── utils/             # Utilitários
│   │   ├── database.ts        # Configuração do banco
│   │   └── server.ts          # Servidor Express
│   ├── knexfile.ts            # Configuração Knex
│   └── package.json
├── src/                        # Frontend React Native
│   ├── components/            # Componentes reutilizáveis
│   ├── navigation/            # Navegação
│   ├── screens/               # Telas do app
│   ├── services/              # Serviços (API)
│   └── utils/                 # Utilitários
├── .gitignore
├── package.json
├── README.md
└── DOCUMENTACAO_COMPLETA.md
```

## 🔧 Scripts Disponíveis

### Frontend
```bash
npm start          # Inicia o Metro bundler
npm run android    # Roda no Android
npm run ios        # Roda no iOS
npm run web        # Roda no navegador
```

### Backend
```bash
npm run dev        # Inicia servidor em modo desenvolvimento
npm run build      # Compila TypeScript
npm start          # Inicia servidor em produção
```

## 🐛 Problemas Conhecidos

### Erro de Chave Duplicada ao Criar Quarteirão
Se encontrar erro de chave duplicada, execute no PostgreSQL:
```sql
SELECT setval('tb_quadras_id_quadra_seq', (SELECT MAX(id_quadra) FROM tb_quarteiroes));
```

### Erro de Conexão com Backend
1. Verifique se o backend está rodando
2. Verifique o IP correto em `src/services/api.ts`
3. Verifique firewall/antivírus

Para mais soluções, consulte a [documentação completa](./DOCUMENTACAO_COMPLETA.md).

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- Seu Nome - [@seu-usuario](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- Equipe de desenvolvimento
- Comunidade React Native
- Contribuidores do projeto

---

**Desenvolvido com ❤️ para o agronegócio brasileiro**
