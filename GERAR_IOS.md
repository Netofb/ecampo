# 📱 Gerar App iOS - eCampo

## Método 1: EAS Build (Recomendado)

### Pré-requisitos
- Conta Expo (gratuita)
- Conta Apple Developer (necessária para instalar em dispositivo físico)

### Passos

1. **Login no EAS**
```bash
npx eas-cli login
```

2. **Gerar build de desenvolvimento (para testar)**
```bash
npx eas-cli build --platform ios --profile development
```

3. **Gerar build de preview (IPA instalável)**
```bash
npx eas-cli build --platform ios --profile preview
```

### Instalar no iPhone

**Opção A: Via TestFlight (Recomendado)**
- Requer conta Apple Developer ($99/ano)
- Upload automático para TestFlight
- Instale o app TestFlight no iPhone
- Receba convite e instale

**Opção B: Ad-Hoc (Sem TestFlight)**
1. Baixe o arquivo `.ipa` do EAS
2. Use Apple Configurator 2 ou Xcode para instalar
3. Requer UDID do dispositivo registrado

**Opção C: Simulator Build**
```bash
npx eas-cli build --platform ios --profile preview --local
```
- Gera build para simulador iOS (não funciona em dispositivo físico)

---

## Método 2: Expo Go (Mais Rápido - Já Funciona!)

Você já está usando e funciona perfeitamente:

1. Instale Expo Go no iPhone (App Store)
2. No computador:
```bash
npm start
```
3. Escaneie o QR code com a câmera do iPhone
4. App abre no Expo Go

**Limitações**: Requer conexão com Metro bundler

---

## Método 3: Build Local (Requer macOS)

⚠️ **Só funciona em macOS com Xcode instalado**

1. **Instalar dependências**
```bash
npx expo prebuild --platform ios
```

2. **Abrir no Xcode**
```bash
open ios/ecampo.xcworkspace
```

3. **Configurar signing**
- Selecione seu Team (Apple Developer Account)
- Configure Bundle Identifier: `com.fabiobarros.ecampo`

4. **Build e instalar**
- Conecte iPhone via USB
- Selecione dispositivo no Xcode
- Clique em "Run" (▶️)

---

## Recomendação

**Para testar agora**: Continue usando **Expo Go** (já funciona!)

**Para distribuir**: Use **EAS Build + TestFlight**

```bash
# Build para TestFlight
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```

---

## Troubleshooting

### "No bundle identifier"
✅ Já configurado em `app.json`: `com.fabiobarros.ecampo`

### "Apple Developer account required"
- Necessário para instalar em dispositivo físico
- Não necessário para simulador ou Expo Go

### "Build failed"
- Verifique logs no EAS Dashboard
- Comum: problemas com dependências nativas

---

## Custos

- **Expo Go**: Gratuito ✅
- **EAS Build**: 30 builds/mês grátis ✅
- **Apple Developer**: $99/ano (para TestFlight e App Store)
