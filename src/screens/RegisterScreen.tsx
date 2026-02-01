// src/screens/RegisterScreen.tsx
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Input from '../components/Input';
import {
  validateCPF,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation';
import { supabase } from '../services/supabase';

const RegisterScreen: React.FC = () => {
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
      // 1. Gerar email fictício baseado no CPF (obrigatório para Supabase Auth)
      const fakeEmail = `${cleanedCPF}@cpf.local`;

      // 2. Registrar no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: {
            cpf: cleanedCPF,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          Alert.alert('CPF já cadastrado', 'Este CPF já possui uma conta. Faça login.');
        } else {
          Alert.alert('Erro no cadastro', 'Não foi possível criar a conta. Tente novamente.');
        }
        return;
      }

      if (authData.user) {
        // 3. Criar perfil na tabela users
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                cpf: cleanedCPF,
                created_at: new Date().toISOString(),
              },
            ]);

          if (profileError) {
            console.log('Erro ao criar perfil:', profileError.message);
            // Mesmo com erro no perfil, o usuário foi criado no auth
            // Pode fazer login normalmente
          }
        } catch (profileErr) {
          console.log('Erro ao criar perfil:', profileErr);
        }

        // 4. Sucesso
        Alert.alert(
          'Conta criada!',
          'Cadastro realizado com sucesso. Agora faça login.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login' as never),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível criar a conta. Tente novamente.');
      console.error('Erro no registro:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Informe seu CPF e crie uma senha</Text>

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
            placeholder="Mínimo 6 caracteres"
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

          <Text style={styles.passwordRequirements}>
            • A senha deve ter no mínimo 6 caracteres
          </Text>

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
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.footerLink}>Faça login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            Ao cadastrar, você concorda com nossos{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#999',
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
    color: '#666',
  },
  footerLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
  terms: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: '#007AFF',
  },
});

export default RegisterScreen;