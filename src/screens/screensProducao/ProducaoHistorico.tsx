import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listProducaoLocal, ProducaoLocal } from '../../services/producaoLocal';
import { AuditoriaLocal, listAuditoriaLocal } from '../../services/auditoriaLocal';

const ProducaoHistorico: React.FC = () => {
  const [entries, setEntries] = useState<ProducaoLocal[]>([]);
  const [audit, setAudit] = useState<AuditoriaLocal[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setEntries(await listProducaoLocal());
    setAudit(await listAuditoriaLocal());
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <Text style={styles.title}>Histórico de produção</Text>
      <Text style={styles.subtitle}>Registros locais pendentes de sincronização.</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>Nenhum registro local.</Text>
      ) : (
        entries.map(entry => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.cardTitle}>{entry.cultura} · {entry.safra}</Text>
            <Text style={styles.text}>{entry.quarteiraoNome}</Text>
            <Text style={styles.text}>
              Área: {entry.areaPlantada || '-'} | Quantidade: {entry.quantidade || '-'}
            </Text>
            <Text style={styles.pending}>Pendente de sincronização</Text>
          </View>
        ))
      )}
      <Text style={styles.sectionTitle}>Auditoria local</Text>
      {audit.length === 0 ? <Text style={styles.empty}>Nenhum evento registrado.</Text> : audit.map(event => (
        <View key={event.id} style={styles.auditRow}>
          <Text style={styles.auditTitle}>{event.acao} · {event.entidade}</Text>
          <Text style={styles.text}>{event.resumo}</Text>
          <Text style={styles.auditDate}>{new Date(event.createdAt).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F7' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#17343B', marginBottom: 6 },
  subtitle: { color: '#4A5568', marginBottom: 20 },
  empty: { color: '#4A5568' },
  card: { backgroundColor: '#FFFFFF', borderColor: '#D7E2DF', borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#17343B', marginBottom: 6 },
  text: { color: '#4A5568', marginBottom: 4 },
  pending: { color: '#B45309', fontWeight: '700', marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#17343B', marginTop: 18, marginBottom: 10 },
  auditRow: { backgroundColor: '#FFFFFF', borderColor: '#D7E2DF', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  auditTitle: { color: '#176B68', fontWeight: '800', marginBottom: 4 },
  auditDate: { color: '#718096', fontSize: 12, marginTop: 4 },
});

export default ProducaoHistorico;
