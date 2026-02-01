import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CadastroLocalidade: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro Localidade</Text>
      <Text>Tela de cadastro localidade - Em construção...</Text>
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

export default CadastroLocalidade;
