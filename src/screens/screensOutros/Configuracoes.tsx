import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const Configuracoes: React.FC = () => {
  const { colors, isDark } = useTheme();
  
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Configuracoes</Text>
        <Text style={{ color: colors.textSecondary }}>Tela de configuracoes - Em construção...</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default Configuracoes;
