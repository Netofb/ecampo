import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listProducaoLocal, ProducaoLocal } from '../../services/producaoLocal';
import { AuditoriaLocal, listAuditoriaLocal } from '../../services/auditoriaLocal';
import { useTheme } from '../../contexts/ThemeContext';

const ProducaoHistorico: React.FC = () => {
  const { colors } = useTheme();
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
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <Text style={[styles.title, { color: colors.text }]}>Histórico de produção</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Registros locais pendentes de sincronização.</Text>
      {entries.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhum registro local.</Text>
      ) : (
        entries.map(entry => (
          <View key={entry.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{entry.cultura} · {entry.safra}</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>{entry.quarteiraoNome}</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>
              Área: {entry.areaPlantada || '-'} | Quantidade: {entry.quantidade || '-'}
            </Text>
            <Text style={styles.pending}>Pendente de sincronização</Text>
          </View>
        ))
      )}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Auditoria local</Text>
      {audit.length === 0 ? <Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhum evento registrado.</Text> : audit.map(event => (
        <View key={event.id} style={[styles.auditRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.auditTitle, { color: colors.primary }]}>{event.acao} · {event.entidade}</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>{event.resumo}</Text>
          <Text style={[styles.auditDate, { color: colors.textSecondary }]}>{new Date(event.createdAt).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { marginBottom: 20 },
  empty: {},
  card: { borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  text: { marginBottom: 4 },
  pending: { color: '#B45309', fontWeight: '700', marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 18, marginBottom: 10 },
  auditRow: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  auditTitle: { fontWeight: '800', marginBottom: 4 },
  auditDate: { fontSize: 12, marginTop: 4 },
});

export default ProducaoHistorico;
