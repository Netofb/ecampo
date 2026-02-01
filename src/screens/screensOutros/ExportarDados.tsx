import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExportarDados: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exportar Dados</Text>
      <Text>Tela de exportar dados - Em construção...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default ExportarDados;
