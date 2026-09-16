import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getApiUrlForDisplay } from '../../services/api';

const Configuracoes: React.FC = () => {
  const { colors, isDark } = useTheme();
  const apiUrl = getApiUrlForDisplay();
  
  const testarConexao = async () => {
    try {
      Alert.alert('⏳ Testando...', 'Conectando ao backend...');
      const response = await fetch(apiUrl.replace('/api', '/api/health'));
      if (response.ok) {
        Alert.alert('✅ Sucesso', 'Backend está acessível!');
      } else {
        Alert.alert('⚠️ Erro', `Status: ${response.status}`);
      }
    } catch (error: any) {
      Alert.alert('❌ Erro de Conexão', error.message || 'Não foi possível conectar ao backend');
    }
  };
  
  const limparCache = async () => {
    Alert.alert(
      '⚠️ Limpar Cache',
      'Isso vai deslogar você e limpar todos os dados locais. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('✅ Sucesso', 'Cache limpo! Reinicie o app.');
            } catch (error) {
              Alert.alert('❌ Erro', 'Não foi possível limpar o cache');
            }
          },
        },
      ]
    );
  };
  
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.section}>
          <View style={styles.titleRow}><Ionicons name="settings-outline" size={27} color={colors.primary} /><Text style={[styles.title, { color: colors.text }]}>Configurações</Text></View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardTitleRow}><Ionicons name="link-outline" size={20} color={colors.primary} /><Text style={[styles.cardTitle, { color: colors.text }]}>Conexão Backend</Text></View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>URL da API:</Text>
            <Text style={[styles.value, { color: colors.text }]} selectable>{apiUrl}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={testarConexao}
          >
            <Ionicons name="pulse-outline" size={18} color="#FFFFFF" /><Text style={styles.buttonText}>Testar conexão</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.danger, marginTop: 8 }]}
            onPress={limparCache}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" /><Text style={styles.buttonText}>Limpar cache</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardTitleRow}><Ionicons name="phone-portrait-outline" size={20} color={colors.primary} /><Text style={[styles.cardTitle, { color: colors.text }]}>Informações do app</Text></View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Versão:</Text>
            <Text style={[styles.value, { color: colors.text }]}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tema:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{isDark ? 'Escuro' : 'Claro'}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardTitleRow}><Ionicons name="document-text-outline" size={20} color={colors.primary} /><Text style={[styles.cardTitle, { color: colors.text }]}>Instruções</Text></View>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            • Certifique-se que o backend está rodando{"\n"}
            • Celular e PC devem estar na mesma rede Wi-Fi{"\n"}
            • Use o botão "Testar Conexão" para verificar
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instruction: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default Configuracoes;
