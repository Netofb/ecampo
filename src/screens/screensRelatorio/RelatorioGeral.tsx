import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { faceService, imovelService, quarteiraoService } from '../../services/api';
import { listProducaoLocal } from '../../services/producaoLocal';
import { useTheme } from '../../contexts/ThemeContext';

type Option = { label: string; value: string };

const RelatorioGeral: React.FC = () => {
  const { colors } = useTheme();
  const [cycle, setCycle] = useState('');
  const [year, setYear] = useState('');
  const [activity, setActivity] = useState('');
  const [quadra, setQuadra] = useState('');
  const [face, setFace] = useState('');
  const [imovel, setImovel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quarteiroes, setQuarteiroes] = useState<any[]>([]);
  const [faces, setFaces] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [dropdown, setDropdown] = useState<{ title: string; options: Option[]; onSelect: (value: string) => void } | null>(null);

  useEffect(() => {
    Promise.all([quarteiraoService.list(), faceService.list(), imovelService.list(), listProducaoLocal()])
      .then(([loadedQuarteiroes, loadedFaces, loadedImoveis, loadedEntries]) => {
        setQuarteiroes(loadedQuarteiroes);
        setFaces(loadedFaces);
        setImoveis(loadedImoveis);
        setEntries(loadedEntries);
      })
      .catch(() => Alert.alert('Relatório de atividades', 'Não foi possível carregar as opções do relatório.'));
  }, []);

  const openDropdown = (title: string, options: Option[], onSelect: (value: string) => void) => setDropdown({ title, options, onSelect });
  const quadraOptions = quarteiroes.map(item => ({ label: item.nome_quadra || `Quarteirão ${item.id_quadra}`, value: String(item.id_quadra) }));
  const faceOptions = faces.filter(item => !quadra || String(item.id_quarteirao) === quadra).map(item => ({ label: `Face ${item.numero_face}`, value: String(item.id_face) }));
  const imovelOptions = imoveis.filter(item => !face || String(item.id_face) === face).map(item => ({ label: `${item.nome_logradouro || 'Imóvel'} ${item.numero || ''}`.trim(), value: String(item.id_imovel) }));

  const clear = () => { setCycle(''); setYear(''); setActivity(''); setQuadra(''); setFace(''); setImovel(''); setStartDate(''); setEndDate(''); };
  const generate = () => {
    const filtered = entries.filter(entry => (!cycle || String(entry.safra).includes(cycle)) && (!quadra || String(entry.quarteiraoId) === quadra));
    Alert.alert('Relatório de atividades', `${filtered.length} atividade(s) encontrada(s) com os filtros selecionados.`);
  };

  const field = (label: string, value: string, title: string, options: Option[], onSelect: (selected: string) => void) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity style={[styles.select, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => openDropdown(title, options, onSelect)}>
        <Text style={[styles.selectText, { color: value ? colors.primary : colors.textSecondary }]} numberOfLines={1}>{options.find(option => option.value === value)?.label || ''}</Text>
        <Ionicons name="chevron-down" size={19} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <View style={styles.titleRow}><Ionicons name="home" size={58} color="#26A84A" /><Text style={[styles.title, { color: colors.textSecondary }]}>Relatório de Imóveis Visitados</Text></View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.grid}>
          {field('Selecione o ciclo', cycle, 'Selecione o ciclo', [{ label: '05/2026', value: '05/2026' }, { label: '06/2026', value: '06/2026' }], setCycle)}
          {field('Selecione o ano', year, 'Selecione o ano', ['2025', '2026', '2027'].map(value => ({ label: value, value })), setYear)}
          {field('Selecione a Atividade', activity, 'Selecione a atividade', ['Inspeção', 'Tratamento', 'Recuperação', 'Pesquisa'].map(value => ({ label: value, value })), setActivity)}
          {field('Selecione a quadra', quadra, 'Selecione a quadra', quadraOptions, value => { setQuadra(value); setFace(''); setImovel(''); })}
          {field('Selecione a face', face, 'Selecione a face', faceOptions, value => { setFace(value); setImovel(''); })}
          {field('Selecione o imóvel', imovel, 'Selecione o imóvel', imovelOptions, setImovel)}
          <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>Data inicial</Text><TextInput style={[styles.select, styles.dateInput, { borderColor: colors.border, color: colors.primary }]} placeholder="mm/dd/yyyy" placeholderTextColor={colors.primary} value={startDate} onChangeText={setStartDate} /></View>
          <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>Data final</Text><TextInput style={[styles.select, styles.dateInput, { borderColor: colors.border, color: colors.primary }]} placeholder="mm/dd/yyyy" placeholderTextColor={colors.primary} value={endDate} onChangeText={setEndDate} /></View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.actions}><TouchableOpacity style={styles.clearButton} onPress={clear}><Text style={styles.clearText}>Limpar</Text></TouchableOpacity><TouchableOpacity style={styles.generateButton} onPress={generate}><Text style={styles.generateText}>Gerar Relatório</Text></TouchableOpacity></View>
      </View>

      <Modal visible={dropdown !== null} transparent animationType="fade" onRequestClose={() => setDropdown(null)}>
        <View style={styles.overlay}><View style={[styles.dropdown, { backgroundColor: colors.card }]}><View style={styles.dropdownHeader}><Text style={[styles.dropdownTitle, { color: colors.text }]}>{dropdown?.title}</Text><TouchableOpacity onPress={() => setDropdown(null)}><Ionicons name="close" size={23} color={colors.text} /></TouchableOpacity></View><ScrollView>{(dropdown?.options || []).map(option => <TouchableOpacity key={option.value} style={[styles.option, { borderBottomColor: colors.border }]} onPress={() => { dropdown?.onSelect(option.value); setDropdown(null); }}><Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text></TouchableOpacity>)}{dropdown?.options.length === 0 && <Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhuma opção disponível</Text>}</ScrollView></View></View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  card: { width: '100%', maxWidth: 700, alignSelf: 'center', borderRadius: 12, padding: 20, shadowOffset: { width: 0, height: 5 }, shadowOpacity: .12, shadowRadius: 12, elevation: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 86 }, title: { flex: 1, fontSize: 29, fontWeight: '500' }, divider: { height: 1, width: '100%', marginVertical: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 }, field: { flexGrow: 1, flexBasis: '46%', minWidth: 240 }, label: { fontSize: 17, marginBottom: 9 }, select: { minHeight: 46, borderWidth: 1, borderRadius: 5, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectText: { flex: 1, fontSize: 16, fontWeight: '700' }, dateInput: { fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18 }, clearButton: { backgroundColor: '#7E8791', borderRadius: 5, paddingHorizontal: 15, minHeight: 43, justifyContent: 'center' }, generateButton: { backgroundColor: '#087EF5', borderRadius: 5, paddingHorizontal: 16, minHeight: 43, justifyContent: 'center' }, clearText: { color: '#fff', fontSize: 16 }, generateText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', padding: 24 }, dropdown: { maxHeight: '70%', borderRadius: 12, overflow: 'hidden' }, dropdownHeader: { minHeight: 54, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#DDE3ED', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dropdownTitle: { fontSize: 18, fontWeight: '800' }, option: { minHeight: 48, paddingHorizontal: 16, justifyContent: 'center', borderBottomWidth: 1 }, optionText: { fontSize: 16 }, empty: { padding: 18, textAlign: 'center' },
});

export default RelatorioGeral;
