# Guia de Segurança - eCampo Backend

## Autenticação Segura

O sistema agora usa **bcrypt** para hash de senhas, garantindo segurança mesmo se o banco de dados for comprometido.

## Configuração Inicial

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env`:
- `DATABASE_URL`: String de conexão do PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT (mínimo 32 caracteres aleatórios)
- `PORT`: Porta do servidor (padrão: 3333)
- `BCRYPT_ROUNDS`: Rounds do bcrypt (10-12 recomendado)

### 2. Gerar Hash de Senhas

Para gerar hash de uma senha:

```bash
cd backend
npm run hash-password suaSenhaAqui
```

Exemplo:
```bash
npm run hash-password 123456
```

Saída:
```
Password: 123456
Hash: $2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNO

Use este hash no banco de dados na coluna senha_usuario
```

### 3. Atualizar Senhas no Banco

Execute no PostgreSQL:

```sql
-- Aumentar tamanho da coluna se necessário
ALTER TABLE usuarios ALTER COLUMN senha_usuario TYPE VARCHAR(255);

-- Atualizar senha de um usuário
UPDATE usuarios 
SET senha_usuario = '$2a$10$hash_gerado_pelo_script'
WHERE cpf_usuario = '12345678909';
```

## Estrutura de Segurança

### Hash de Senhas (bcrypt)
- **Algoritmo**: bcrypt com salt automático
- **Rounds**: 10 (configurável via `BCRYPT_ROUNDS`)
- **Tamanho**: ~60 caracteres

### JWT (JSON Web Tokens)
- **Algoritmo**: HS256
- **Expiração**: 7 dias (configurável em `utils/auth.ts`)
- **Secret**: Definido em `JWT_SECRET`

### Validação de CPF
- Remove formatação automaticamente
- Busca no banco sem pontos e hífens
- Suporta CPF formatado ou não

## Fluxo de Login

1. Cliente envia CPF e senha
2. Backend remove formatação do CPF
3. Busca usuário no banco
4. Compara senha com bcrypt
5. Gera JWT se válido
6. Retorna token e dados do usuário

## Endpoints Protegidos

Todos os endpoints exceto `/api/auth/login` e `/api/auth/register` requerem token JWT no header:

```
Authorization: Bearer <token>
```

## Boas Práticas

### Produção
- Use HTTPS sempre
- Configure `JWT_SECRET` com 32+ caracteres aleatórios
- Use `BCRYPT_ROUNDS` entre 10-12
- Nunca commite o arquivo `.env`
- Rotacione `JWT_SECRET` periodicamente

### Desenvolvimento
- Use `.env.example` como template
- Não compartilhe credenciais
- Teste com usuários de teste

## Migração de Senhas Antigas

Se você tem senhas em texto plano no banco:

```bash
# 1. Gere hash para cada senha
npm run hash-password senha_antiga

# 2. Atualize no banco
UPDATE usuarios SET senha_usuario = '$2a$10$hash...' WHERE id_usuario = 1;
```

## Troubleshooting

### Erro: "Invalid credentials"
- Verifique se a senha no banco está com hash bcrypt
- Confirme que a coluna `senha_usuario` tem VARCHAR(255)
- Teste gerando novo hash com `npm run hash-password`

### Erro: "User not found"
- Verifique formatação do CPF no banco
- CPF pode estar com ou sem pontos/hífens

### Token expirado
- Tokens JWT expiram em 7 dias
- Usuário precisa fazer login novamente
