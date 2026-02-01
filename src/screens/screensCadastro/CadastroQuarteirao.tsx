import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CadastroQuarteirao: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro Quarteirao</Text>
      <Text>Tela de cadastro quarteirao - Em construção...</Text>
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

export default CadastroQuarteirao;
