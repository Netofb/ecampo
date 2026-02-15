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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Input from '../components/Input';
import {
  validateCPF,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation';
import { authService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const RegisterScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleRegister = async () => {
    const cleanedCPF = cpf.replace(/\D/g, '');
    
    const cpfValidation = validateCPF(cleanedCPF);
    const passwordValidation = validatePassword(password);
    const confirmValidation = validateConfirmPassword(password, confirmPassword);

    setCpfError(cpfValidation);
    setPasswordError(passwordValidation);
    setConfirmPasswordError(confirmValidation);

    if (cpfValidation || passwordValidation || confirmValidation) {
      return;
    }

    setLoading(true);

    try {
      // Registrar no novo backend
      const response = await authService.register(cleanedCPF, password);

      // Persistir o token e userId no AsyncStorage
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('userId', response.user.id);
      await AsyncStorage.setItem('userCPF', cleanedCPF);

      // Sucesso - navegar para Home
      Alert.alert(
        'Conta criada!',
        'Cadastro realizado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Home' as never }],
            }),
          },
        ]
      );
    } catch (error: any) {
      const message = error.message || 'Não foi possível criar a conta. Tente novamente.';
      Alert.alert('Erro no cadastro', message);
      console.error('Erro no registro:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
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
            <Text style={[styles.title, { color: colors.text }]}>Criar Conta</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Informe seu CPF e crie uma senha</Text>

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

          <Input
            label="Confirmar Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Digite a senha novamente"
            secureTextEntry
            error={confirmPasswordError}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.footerLink}>Faça login</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.terms, { color: colors.textSecondary }]}>
            Ao cadastrar, você concorda com nossos{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>.
          </Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  passwordRequirements: {
    fontSize: 12,
    color: '#666',
    marginTop: -8,
    marginBottom: 16,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  footerText: {
  },
  footerLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: '#007AFF',
  },
});

export default RegisterScreen;