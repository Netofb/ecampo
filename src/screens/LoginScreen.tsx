import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import Input from '../components/Input';
import { validateCPF, validatePassword } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const LoginScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { login, loading } = useAuth();
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length > 3 && cleaned.length <= 6) {
      formatted = cleaned.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    } else if (cleaned.length > 6 && cleaned.length <= 9) {
      formatted = cleaned.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (cleaned.length > 9) {
      formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    }
    
    return formatted;
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);
  };

  const handleLogin = async () => {
    const cleanedCPF = cpf.replace(/\D/g, '');
    
    const cpfValidation = validateCPF(cleanedCPF);
    const passwordValidation = validatePassword(password);

    setCpfError(cpfValidation);
    setPasswordError(passwordValidation);

    if (cpfValidation || passwordValidation) {
      return;
    }

    try {
      await login(cleanedCPF, password);
    } catch (error: any) {
      const message = error.message || 'Ocorreu um erro ao fazer login. Tente novamente.';
      Alert.alert('Erro no login', message);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert(
      'Google Login',
      'O login com Google ainda não está configurado nesta versão.',
      [{ text: 'OK' }]
    );
  };

  const navigateToForgotPassword = () => {
    Alert.alert(
      'Esqueceu a senha?',
      'Entre em contato com o suporte para recuperar seu acesso.',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Image source={require('../../assets/logoEcampo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: colors.text }]}>Bem-vindo ao eCampo</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Faça login com seu CPF e senha</Text>

          <Input
            label="CPF"
            value={cpf}
            onChangeText={handleCPFChange}
            placeholder="000.000.000-00"
            keyboardType="numeric"
            maxLength={14}
            autoCapitalize="none"
            error={cpfError}
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha"
            secureTextEntry
            error={passwordError}
            
          />

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={navigateToForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 100,
    textAlign: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4e73df',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    color: '#333',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
  },
  footerLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default LoginScreen;