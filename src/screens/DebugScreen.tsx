import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';

export default function DebugScreen() {
  const [result, setResult] = useState('');

  const testConnection = async () => {
    const urls = [
      'http://10.0.2.2:3333/api/auth/profile',
      'http://192.168.56.1:3333/api/auth/profile',
      'http://localhost:3333/api/auth/profile',
    ];

    let results = 'Testando conexões...\n\n';

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        results += `✅ ${url}\nStatus: ${response.status}\n\n`;
      } catch (error: any) {
        results += `❌ ${url}\nErro: ${error.message}\n\n`;
      }
    }

    setResult(results);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug de Conexão</Text>
      <Button title="Testar Conexões" onPress={testConnection} />
      <ScrollView style={styles.resultContainer}>
        <Text style={styles.result}>{result}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  result: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
