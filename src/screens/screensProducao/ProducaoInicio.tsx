import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { faceService, imovelService, localidadeService, quarteiraoService, zonaService } from '../../services/api';
import { addProducaoLocal, listProducaoLocal } from '../../services/producaoLocal';
import { useTheme } from '../../contexts/ThemeContext';
import QuarteiraoMapWebView from '../../components/QuarteiraoMapWebView';

const ProducaoInicio: React.FC = () => {
  const { colors } = useTheme();
  const [quarteiroes, setQuarteiroes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [cultura, setCultura] = useState('');
  const [safra, setSafra] = useState('');
  const [areaPlantada, setAreaPlantada] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valor, setValor] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [faces, setFaces] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  const [localidades, setLocalidades] = useState<any[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedZona, setSelectedZona] = useState('');
  const [selectedLocalidade, setSelectedLocalidade] = useState('');
  const [atividade, setAtividade] = useState('');
  const [dataAtividade, setDataAtividade] = useState('15/09/2026');
  const [cicloAno, setCicloAno] = useState('05/2026');
  const [tipoAtividade, setTipoAtividade] = useState('');
  const [zonaConcluida, setZonaConcluida] = useState('');
  const [seq, setSeq] = useState('');
  const [horaVisita, setHoraVisita] = useState('08:38 PM');
  const [visita, setVisita] = useState('');
  const [pendencia, setPendencia] = useState('');
  const [amostraInicio, setAmostraInicio] = useState('0');
  const [amostraFim, setAmostraFim] = useState('0');
  const [tubitos, setTubitos] = useState('0');
  const [selectedFace, setSelectedFace] = useState<any | null>(null);
  const [selectedImovel, setSelectedImovel] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([quarteiraoService.list(), listProducaoLocal(), faceService.list(), imovelService.list(), zonaService.list(), localidadeService.list()])
      .then(([loadedQuarteiroes, loadedEntries, loadedFaces, loadedImoveis, loadedZonas, loadedLocalidades]) => {
        setQuarteiroes(loadedQuarteiroes);
        setEntries(loadedEntries);
        setFaces(loadedFaces);
        setImoveis(loadedImoveis);
        setZonas(loadedZonas);
        setLocalidades(loadedLocalidades);
      })
      .catch(error => Alert.alert('Produção', error?.message || 'Não foi possível carregar os quarteirões.'));
  }, []);

  const save = async () => {
    if (!selected || !(atividade.trim() || cultura.trim()) || !(cicloAno.trim() || safra.trim())) {
      Alert.alert('Produção', 'Selecione um quarteirão e informe a atividade e o ciclo/ano.');
      return;
    }

    await addProducaoLocal({
      quarteiraoId: Number(selected.id_quadra),
      quarteiraoNome: selected.nome_quadra || selected.nome || `Quarteirão ${selected.id_quadra}`,
      cultura: atividade.trim() || cultura.trim(),
      safra: cicloAno.trim() || safra.trim(),
      areaPlantada,
      quantidade,
      valor,
    });

    setEntries(await listProducaoLocal());

    setCultura('');
    setSafra('');
    setAreaPlantada('');
    setQuantidade('');
    setValor('');
    setAtividade('');
    setTipoAtividade('');
    setZonaConcluida('');
    setSeq('');
    setVisita('');
    setPendencia('');
    setSelectedFace(null);
    setSelectedImovel(null);
    setModalVisible(false);
    Alert.alert('Produção', 'Registro salvo localmente e marcado como pendente de sincronização.');
  };

  const metrics = [
    ['VISITAS HOJE', entries.length, 'clipboard', '#3478E5'],
    ['NORMAIS', entries.filter(entry => entry.status === 'Normal').length, 'checkmark-circle', '#2EAF68'],
    ['RECUPERADAS', 0, 'refresh', '#249DB5'],
    ['FECHADOS', entries.filter(entry => entry.status === 'Fechado').length, 'lock-closed', '#E58A19'],
    ['RECUSAS', 0, 'ban', '#E04444'],
    ['INSPECIONADOS', entries.length, 'search-circle', '#8651E8'],
    ['TRATADOS', 0, 'medkit', '#2EAF68'],
    ['DEP. ELIMINADOS', 0, 'trash', '#E04444'],
    ['TUBITOS', 0, 'flask', '#249DB5'],
    ['AMOSTRA INÍCIO', 0, 'play', '#3478E5'],
    ['AMOSTRA FIM', 0, 'flag', '#E58A19'],
    ['CARGA LARVICIDA', 0, 'list', '#8651E8'],
  ] as const;

  const deposits = [
    ['A1 ELEVADO', 0, '#3478E5', 'water'], ['A2 SOLO', 0, '#249DB5', 'water-outline'],
    ['B MÓVEIS', 0, '#E58A19', 'cube'], ['C FIXOS', 0, '#8651E8', 'pin'],
    ['D1 PNEUS', 0, '#E04444', 'radio-button-off'], ['D2 LIXO', 0, '#E04444', 'trash'],
    ['E NATURAIS', 0, '#2EAF68', 'leaf'],
  ] as const;
  const dropdownOptions: Record<string, string[]> = {
    zona: zonas.map(item => item.nome_zona).filter(Boolean),
    localidade: localidades.map(item => item.nome_localidade).filter(Boolean),
    atividade: ['Inspeção', 'Tratamento', 'Recuperação', 'Pesquisa'],
    tipo: ['Normal', 'Recuperada', 'Recusa'],
    concluida: ['Sim', 'Não'],
    visita: ['Normal', 'Não realizada', 'Recusada'],
    pendencia: ['Sem pendência', 'Retornar ao imóvel', 'Aguardando informação'],
    quarteirao: quarteiroes.map(item => item.nome_quadra || `#${item.id_quadra}`),
    face: faces.filter(face => !selected || face.id_quarteirao === selected.id_quadra).map(face => `Face ${face.numero_face}`),
    imovel: imoveis.filter(imovel => !selectedFace || imovel.id_face === selectedFace.id_face).map(imovel => `Nº ${imovel.numero || imovel.id_imovel}`),
  };
  const dropdownTitles: Record<string, string> = { zona: 'Selecione a zona', localidade: 'Selecione a localidade', atividade: 'Selecione a atividade', tipo: 'Selecione o tipo', concluida: 'Zona concluída?', visita: 'Visita (N/R)', pendencia: 'Pendência', quarteirao: 'Selecione o quarteirão', face: 'Selecione a face', imovel: 'Selecione o imóvel' };
  const openDropdown = (key: string) => setActiveDropdown(key);
  const selectDropdownValue = (value: string) => {
    if (activeDropdown === 'zona') setSelectedZona(value);
    if (activeDropdown === 'localidade') setSelectedLocalidade(value);
    if (activeDropdown === 'atividade') setAtividade(value);
    if (activeDropdown === 'tipo') setTipoAtividade(value);
    if (activeDropdown === 'concluida') setZonaConcluida(value);
    if (activeDropdown === 'visita') setVisita(value);
    if (activeDropdown === 'pendencia') setPendencia(value);
    if (activeDropdown === 'quarteirao') {
      const quarteirao = quarteiroes.find(item => (item.nome_quadra || `#${item.id_quadra}`) === value);
      if (quarteirao) { setSelected(quarteirao); setSelectedFace(null); setSelectedImovel(null); }
    }
    if (activeDropdown === 'face') {
      const face = faces.find(item => `Face ${item.numero_face}` === value);
      if (face) { setSelectedFace(face); setSelectedImovel(null); }
    }
    if (activeDropdown === 'imovel') {
      const imovel = imoveis.find(item => `Nº ${item.numero || item.id_imovel}` === value);
      if (imovel) setSelectedImovel(imovel);
    }
    setActiveDropdown(null);
  };
  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      <View style={[styles.pageHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="home" size={30} color="#19C88A" />
        <Text style={[styles.pageTitle, { color: colors.primary }]}>Cadastro de Visitas</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#13A9E3' }]} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" /><Text style={styles.actionText}>Inserir Nova Atividade</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#E5242B' }]} onPress={() => Alert.alert('PDF', 'O PDF será disponibilizado após a sincronização dos registros.')}>
          <MaterialIcons name="picture-as-pdf" size={20} color="#fff" /><Text style={styles.actionText}>PDF das Atividades do Dia</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        {metrics.map(([label, value, icon, color]) => <View key={label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View><Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text><Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text></View><Ionicons name={icon as any} size={29} color={color} /></View>)}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}><MaterialIcons name="table-view" size={18} color={colors.text} /><Text style={[styles.sectionTitle, { color: colors.text }]}>Produção de hoje</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableContent}>
          <View>
            <View style={styles.tableRow}>{['Zona', 'Localidade', 'Quarteirão', 'Seq', 'Face', 'Logradouro', 'Nº', 'Seq Imóvel', 'Complemento', 'Tipo', 'Hora', 'Visita', 'Pendência', 'A1', 'A2', 'B', 'C', 'D1', 'D2'].map(column => <Text key={column} style={[styles.tableHeader, { color: colors.text }]}>{column}</Text>)}</View>
            {entries.length === 0 ? <Text style={[styles.emptyTable, { color: colors.textSecondary }]}>Nenhum registro encontrado</Text> : entries.map(entry => <View key={entry.id} style={styles.tableRow}><Text style={styles.tableCell}>{entry.quarteiraoNome}</Text><Text style={styles.tableCell}>{entry.cultura}</Text><Text style={styles.tableCell}>{entry.safra}</Text></View>)}
          </View>
        </ScrollView>
        <View style={[styles.totals, { borderTopColor: colors.border }]}><Text style={[styles.totalText, { color: colors.text }]}>TOTAIS</Text><Text style={[styles.totalText, { color: colors.text }]}>{entries.length}</Text></View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}><Ionicons name="pie-chart" size={18} color={colors.text} /><Text style={[styles.sectionTitle, { color: colors.text }]}>Resumo de depósitos</Text></View>
        <View style={styles.metricsGrid}>{deposits.map(([label, value, color, icon]) => <View key={label} style={[styles.metricCard, styles.depositCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View><Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text><Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text></View><Ionicons name={icon as any} size={29} color={color} /></View>)}</View>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.activityModal, { backgroundColor: colors.card }]}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Adicionar Atividade -</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={25} color="#DCE5FF" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.activityBody} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldGrid}>
                <View style={styles.field}><Text style={styles.fieldLabel}>Selecione a zona</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('zona')}><Text style={styles.selectValue} numberOfLines={1}>{selectedZona || selected?.nome_zona || 'Selecione uma zona'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Selecione a Localidade</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('localidade')}><Text style={styles.selectValue} numberOfLines={1}>{selectedLocalidade || selected?.nome_localidade || 'Selecione uma localidade'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Atividade</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('atividade')}><Text style={styles.selectValue}>{atividade || 'Selecione a atividade'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Data Atividade</Text><TextInput style={styles.activityInput} value={dataAtividade} onChangeText={setDataAtividade} /></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Ciclo/Ano</Text><TextInput style={[styles.activityInput, styles.readonly]} value={cicloAno} onChangeText={setCicloAno} /></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Tipo</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('tipo')}><Text style={styles.selectValue}>{tipoAtividade || 'Selecione o tipo'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Zona Concluída?</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('concluida')}><Text style={styles.selectValue}>{zonaConcluida || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View>
              </View>

              <View style={styles.activityPanel}>
                <View style={styles.fieldGrid}>
                  <View style={[styles.field, styles.quadField]}><Text style={styles.fieldLabel}>Selecione o quarteirão</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('quarteirao')}><Text style={styles.selectValue} numberOfLines={1}>{selected?.nome_quadra || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View>
                  <View style={[styles.field, styles.seqField]}><Text style={styles.fieldLabel}>Seq</Text><TextInput style={styles.activityInput} value={seq} onChangeText={setSeq} keyboardType="numeric" /></View>
                  <View style={[styles.field, styles.faceField]}><Text style={styles.fieldLabel}>Selecione a face</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('face')}><Text style={styles.selectValue} numberOfLines={1}>{selectedFace ? `Face ${selectedFace.numero_face}` : 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View>
                  <View style={[styles.field, styles.imovelField]}><Text style={styles.fieldLabel}>Selecione o imóvel</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('imovel')}><Text style={styles.selectValue} numberOfLines={1}>{selectedImovel ? `Nº ${selectedImovel.numero || selectedImovel.id_imovel}` : 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View>
                </View>
                <View style={styles.propertyBox}><Text style={styles.propertyTitle}>DADOS DO IMÓVEL SELECIONADO</Text><View style={styles.propertyGrid}>{[['LOGRADOURO', selectedImovel?.nome_logradouro || 'Selecione um imóvel'], ['NÚMERO', selectedImovel?.numero || '-'], ['SEQ. IMÓVEL', selectedImovel?.seq || '-'], ['COMPLEMENTO', selectedImovel?.complemento || '-'], ['TIPO', selectedImovel?.tipo || '-']].map(([label, value]) => <View key={label} style={styles.property}><Text style={styles.propertyLabel}>{label}</Text><Text style={styles.propertyValue}>{value}</Text></View>)}</View></View>
                <View style={styles.fieldGrid}><View style={styles.field}><Text style={styles.fieldLabel}>Hora Visita</Text><TextInput style={styles.activityInput} value={horaVisita} onChangeText={setHoraVisita} /></View><View style={styles.field}><Text style={styles.fieldLabel}>Visita (N/R)</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('visita')}><Text style={styles.selectValue}>{visita || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View><View style={styles.field}><Text style={styles.fieldLabel}>Pendência</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('pendencia')}><Text style={styles.selectValue}>{pendencia || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color="#173BFF" /></TouchableOpacity></View></View>
              </View>

              <Text style={styles.subsectionTitle}>Coleta Amostra</Text>
              <View style={styles.sampleBox}><Text style={styles.sampleTitle}>Nº da amostra</Text><View style={styles.fieldGrid}><View style={styles.field}><Text style={styles.fieldLabel}>Nº Amostra Início</Text><TextInput style={styles.activityInput} value={amostraInicio} onChangeText={setAmostraInicio} keyboardType="numeric" /></View><View style={styles.field}><Text style={styles.fieldLabel}>Nº Amostra Fim</Text><TextInput style={styles.activityInput} value={amostraFim} onChangeText={setAmostraFim} keyboardType="numeric" /></View><View style={styles.field}><Text style={styles.fieldLabel}>Qtd Tubitos</Text><TextInput style={styles.activityInput} value={tubitos} onChangeText={setTubitos} keyboardType="numeric" /></View></View></View>
              <View style={styles.mapPanel}><TouchableOpacity style={styles.locationButton} onPress={() => Alert.alert('Localização', 'A localização atual será usada quando o GPS estiver disponível.')}><Ionicons name="navigate" size={18} color="#4C70E8" /><Text style={styles.locationText}>Detectar Localização Atual</Text></TouchableOpacity><Text style={styles.coordinates}>Lat: {Number(selected?.latitude_quadra || -8.3797).toFixed(6)} | Lon: {Number(selected?.longitude_quadra || -35.4508).toFixed(6)}</Text><QuarteiraoMapWebView initialPolygon={selected?.poligono_geojson || selected?.geojson || null} initialCenter={{ lat: Number(selected?.latitude_quadra) || -8.3797, lng: Number(selected?.longitude_quadra) || -35.4508 }} interactive={false} height={280} /></View>
            </ScrollView>
            <View style={styles.activityFooter}><TouchableOpacity style={styles.cancelActivity} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.saveActivity} onPress={save}><Ionicons name="save" size={17} color="#fff" /><Text style={styles.saveText}>Salvar</Text></TouchableOpacity></View>
          </View>
        </View>
      </Modal>
      <Modal visible={activeDropdown !== null} transparent animationType="fade" onRequestClose={() => setActiveDropdown(null)}>
        <View style={styles.dropdownOverlay}>
          <View style={[styles.dropdownModal, { backgroundColor: colors.card }]}>
            <View style={styles.dropdownHeader}><Text style={[styles.dropdownTitle, { color: colors.text }]}>{activeDropdown ? dropdownTitles[activeDropdown] : ''}</Text><TouchableOpacity onPress={() => setActiveDropdown(null)}><Ionicons name="close" size={22} color={colors.text} /></TouchableOpacity></View>
            <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
              {(activeDropdown ? dropdownOptions[activeDropdown] || [] : []).map(option => <TouchableOpacity key={option} style={[styles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => selectDropdownValue(option)}><Text style={[styles.dropdownItemText, { color: colors.text }]}>{option}</Text><Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /></TouchableOpacity>)}
              {activeDropdown && (dropdownOptions[activeDropdown] || []).length === 0 && <Text style={[styles.dropdownEmpty, { color: colors.textSecondary }]}>Nenhuma opção disponível</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, gap: 16 },
  pageHeader: { minHeight: 78, borderWidth: 1, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  pageTitle: { fontSize: 26, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionButton: { minHeight: 48, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { flexGrow: 1, flexBasis: '30%', minWidth: 145, minHeight: 104, borderWidth: 1, borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  depositCard: { minWidth: 140 },
  metricLabel: { fontSize: 12, fontWeight: '800', marginBottom: 7 },
  metricValue: { fontSize: 27, fontWeight: '800' },
  section: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  sectionHeader: { minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  tableContent: { minWidth: 1100, padding: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#DDE3EC', minHeight: 38, alignItems: 'center' },
  tableHeader: { width: 82, fontSize: 11, fontWeight: '800', paddingHorizontal: 5 },
  tableCell: { width: 82, fontSize: 11, paddingHorizontal: 5 },
  emptyTable: { padding: 16, textAlign: 'center' },
  totals: { minHeight: 42, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, borderTopWidth: 1 },
  totalText: { fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'flex-end' },
  modal: { maxHeight: '90%', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  activityModal: { height: '96%', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  activityHeader: { minHeight: 58, backgroundColor: '#4D70D9', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityTitle: { color: '#fff', fontSize: 21, fontWeight: '500' },
  activityBody: { padding: 20, gap: 20 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  field: { flexGrow: 1, flexBasis: '22%', minWidth: 150 },
  quadField: { flexBasis: '23%' },
  seqField: { flexBasis: '8%', minWidth: 75 },
  faceField: { flexBasis: '27%' },
  imovelField: { flexBasis: '30%' },
  fieldLabel: { color: '#454545', fontSize: 16, marginBottom: 7 },
  select: { minHeight: 46, borderWidth: 1, borderColor: '#D4D9E6', borderRadius: 7, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { color: '#173BFF', fontSize: 16, fontWeight: '700', flex: 1 },
  activityInput: { minHeight: 46, borderWidth: 1, borderColor: '#D4D9E6', borderRadius: 7, paddingHorizontal: 14, color: '#173BFF', fontSize: 16, fontWeight: '600' },
  readonly: { backgroundColor: '#EAEDF5' },
  activityPanel: { borderWidth: 1, borderColor: '#DDE3ED', borderRadius: 14, padding: 16, gap: 18 },
  optionSelected: { backgroundColor: '#4D70D9', borderColor: '#4D70D9' },
  optionTextSelected: { color: '#fff' },
  propertyBox: { backgroundColor: '#EFF7FF', borderWidth: 1, borderColor: '#BBD8FF', borderRadius: 12, padding: 12 },
  propertyTitle: { color: '#244B91', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  propertyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  property: { flexGrow: 1, flexBasis: '17%', minWidth: 125, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D5E5FF', borderRadius: 9, padding: 10 },
  propertyLabel: { color: '#60718A', fontSize: 10, fontWeight: '800', marginBottom: 5 },
  propertyValue: { color: '#243044', fontWeight: '700' },
  subsectionTitle: { color: '#333', fontSize: 18, fontWeight: '700' },
  sampleBox: { backgroundColor: '#FFFDE8', borderWidth: 1, borderColor: '#E2E0C8', borderRadius: 12, padding: 12, gap: 10 },
  sampleTitle: { color: '#424242', fontSize: 17, fontWeight: '500' },
  mapPanel: { borderWidth: 1, borderColor: '#D5D5D5', borderRadius: 9, padding: 12, gap: 8 },
  locationButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#4C70E8', borderRadius: 5, minHeight: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { color: '#4C70E8', fontSize: 15 },
  coordinates: { color: '#8991A4', fontSize: 13 },
  activityFooter: { minHeight: 64, borderTopWidth: 1, borderTopColor: '#E1E3E8', padding: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelActivity: { minWidth: 100, minHeight: 42, borderRadius: 7, backgroundColor: '#8A8D99', justifyContent: 'center', alignItems: 'center' },
  saveActivity: { minWidth: 110, minHeight: 42, borderRadius: 7, backgroundColor: '#4D70D9', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 7 },
  cancelText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', padding: 22 },
  dropdownModal: { maxHeight: '70%', borderRadius: 14, overflow: 'hidden' },
  dropdownHeader: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#DDE3ED' },
  dropdownTitle: { fontSize: 18, fontWeight: '800' },
  dropdownScroll: { flexGrow: 0 },
  dropdownItem: { minHeight: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  dropdownItemText: { fontSize: 16, fontWeight: '600' },
  dropdownEmpty: { padding: 18, textAlign: 'center' },
  label: { fontWeight: '700', marginBottom: 8 },
  options: { gap: 8, paddingBottom: 18 },
  option: { padding: 12, borderRadius: 8, borderWidth: 1 },
  optionText: { fontWeight: '600' },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  button: { minHeight: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { fontWeight: '700' },
});

export default ProducaoInicio;
