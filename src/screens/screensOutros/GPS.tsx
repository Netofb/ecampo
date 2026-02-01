import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GPS: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>G P S</Text>
      <Text>Tela de g p s - Em construção...</Text>
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

export default GPS;
