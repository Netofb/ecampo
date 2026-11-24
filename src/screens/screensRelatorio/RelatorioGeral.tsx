import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { faceService, imovelService, producaoService, quarteiraoService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

type Option = { key: string; label: string; value: string };

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
const numberValue = (value: unknown) => Number(value || 0) || 0;
const reportDateLabel = (value: unknown) => {
  if (!value) return '';
  const date = String(value).slice(0, 10);
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value);
};

const buildReportHtml = (records: any[], metadata: any, logoData: string, filters: Record<string, string>) => {
  const sums = { a1: 0, a2: 0, b: 0, c: 0, d1: 0, d2: 0, e: 0, tubitos: 0, amostraInicio: 0, amostraFim: 0, eliminados: 0, tratados: 0, cargaLarvicida: 0, depositoTratado: 0, cargaAdulticida: 0 };
  let inspecionados = 0;
  records.forEach(row => {
    for (const key of ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e'] as const) sums[key] += numberValue(row[key]);
    sums.tubitos += numberValue(row.qtd_tubitos);
    sums.amostraInicio += numberValue(row.nu_amostra_ini);
    sums.amostraFim += numberValue(row.nu_amostra_fim);
    sums.eliminados += numberValue(row.depositos_eliminados);
    sums.tratados += numberValue(row.imoveis_tratados);
    sums.cargaLarvicida += numberValue(row.larvicida_qtd_carga);
    sums.depositoTratado += numberValue(row.larvicida_qtd_dep_trat);
    sums.cargaAdulticida += numberValue(row.adulticida_qtd_carga);
    if (['1', 'sim', 'true'].includes(String(row.imovel_insp ?? '').trim().toLowerCase())) inspecionados++;
  });
  const totalDepositos = sums.a1 + sums.a2 + sums.b + sums.c + sums.d1 + sums.d2 + sums.e;
  const location = (code: unknown, name: unknown) => [code, name].filter(value => value != null && String(value).trim()).join(' - ');
  const body = records.map(row => {
    const property = [row.nome_logradouro, row.numero_imovel ? `nº ${row.numero_imovel}` : '', row.complemento].filter(Boolean).join(', ');
    const cells = [
      reportDateLabel(row.data_atividade), location(row.co_zona, row.nome_zona), location(row.co_localidade, row.nome_localidade), location(row.numero_quadra, row.nome_quadra), row.numero_face ?? '', property,
      row.nome_atividade || row.atividade || '', row.tipo_imovel || row.cabecalho_tipo || '', row.hora_visita || '', row.visita_n_r || '', row.pendencia || '',
      ...(['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e'] as const).map(key => numberValue(row[key])),
      ['1', 'sim', 'true'].includes(String(row.imovel_insp ?? '').trim().toLowerCase()) ? 'Sim' : 'Não', numberValue(row.nu_amostra_ini), numberValue(row.nu_amostra_fim), numberValue(row.qtd_tubitos), numberValue(row.depositos_eliminados), numberValue(row.imoveis_tratados),
      row.larvicida_tipo || '', numberValue(row.larvicida_qtd_carga), numberValue(row.larvicida_qtd_dep_trat), row.adulticida_tipo || '', numberValue(row.adulticida_qtd_carga),
    ];
    return `<tr>${cells.map((cell, index) => `<td${index === 0 || (index >= 11 && index <= 17) || (index >= 18 && index !== 24 && index !== 27) ? ' class="num"' : ''}>${escapeHtml(cell)}</td>`).join('')}</tr>`;
  }).join('');
  const scope = [filters.ano && `Ano ${filters.ano}`, filters.ciclo && `Ciclo ${filters.ciclo}`, filters.dataInicial && `De ${reportDateLabel(filters.dataInicial)}`, filters.dataFinal && `Até ${reportDateLabel(filters.dataFinal)}`].filter(Boolean).join(' · ');
  const generated = new Date().toLocaleString('pt-BR');
  const totals = [sums.a1, sums.a2, sums.b, sums.c, sums.d1, sums.d2, sums.e, inspecionados, sums.amostraInicio, sums.amostraFim, sums.tubitos, sums.eliminados, sums.tratados, '-', sums.cargaLarvicida, sums.depositoTratado, '-', sums.cargaAdulticida];
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório de Imóveis Visitados</title><style>
@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{margin:0;background:#e5e7eb;color:#172033;font-family:Arial,Helvetica,sans-serif}.sheet{width:100%;margin:0 auto;padding:14px;background:#fff;border:1px solid #cbd5e1}.header{display:grid;grid-template-columns:210px 1fr 205px;align-items:center;border:1px solid #94a3b8}.logo{padding:8px;text-align:center}.logo img{max-width:190px;max-height:60px;object-fit:contain}.title{padding:10px;border-left:1px solid #94a3b8;border-right:1px solid #94a3b8;text-align:center}.title h1{margin:0;color:#0f3b63;font-size:20px}.title p{margin:5px 0 0;font-size:11px}.meta{padding:9px;font-size:10px}.meta strong{display:block;color:#475569}.summary{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:10px 0}.kpi{padding:7px;border:1px solid #dbe4ee;border-radius:7px;background:#f8fafc;text-align:center}.kpi small{display:block;color:#64748b;font-size:8px;font-weight:800;text-transform:uppercase}.kpi strong{display:block;margin-top:3px;color:#0f172a;font-size:16px}.table-wrap{overflow:visible}table{width:100%;border-collapse:collapse;font-size:7.1px}th,td{padding:3px;border:1px solid #94a3b8;vertical-align:middle}th{background:#dbeafe;color:#0f2942;font-weight:800;text-transform:uppercase}tfoot td{background:#e2e8f0;color:#0f172a;font-weight:900}.num{text-align:center}.total-label{text-align:right;background:#cbd5e1}.footer{display:flex;justify-content:space-between;margin-top:8px;color:#475569;font-size:9px}@media print{body{background:#fff}.sheet{padding:0;border:0}.table-wrap{overflow:visible}table{font-size:6.6px}th,td{padding:2px}}
</style></head><body><main class="sheet"><header class="header"><div class="logo">${logoData ? `<img src="data:image/png;base64,${logoData}" alt="eCampo">` : '<strong style="color:#0f3b63;font-size:24px">eCampo</strong>'}</div><div class="title"><h1>Relatório de Imóveis Visitados</h1><p>${escapeHtml(scope || 'Todos os filtros')}</p></div><div class="meta"><strong>Agente responsável</strong>${escapeHtml(metadata.agente || 'Profissional logado')}<strong style="margin-top:5px">IBGE</strong>${escapeHtml(metadata.ibge || '-')}</div></header><section class="summary"><div class="kpi"><small>Visitas</small><strong>${records.length}</strong></div><div class="kpi"><small>Inspecionados</small><strong>${inspecionados}</strong></div><div class="kpi"><small>Tratados</small><strong>${sums.tratados}</strong></div><div class="kpi"><small>Dep. eliminados</small><strong>${sums.eliminados}</strong></div><div class="kpi"><small>Tubitos</small><strong>${sums.tubitos}</strong></div><div class="kpi"><small>Depósitos A1–E</small><strong>${totalDepositos}</strong></div></section><div class="table-wrap"><table><thead><tr><th>Data</th><th>Zona</th><th>Localidade</th><th>Quadra</th><th>Face</th><th>Imóvel</th><th>Atividade</th><th>Tipo</th><th>Hora</th><th>Visita</th><th>Pendência</th><th>A1</th><th>A2</th><th>B</th><th>C</th><th>D1</th><th>D2</th><th>E</th><th>Insp.</th><th>Amostra I.</th><th>Amostra F.</th><th>Tub.</th><th>Elim.</th><th>Trat.</th><th>Larvicida</th><th>Carga</th><th>Dep. trat.</th><th>Adulticida</th><th>Carga</th></tr></thead><tbody>${body || '<tr><td colspan="29" style="padding:18px;text-align:center">Nenhum registro encontrado para os filtros selecionados.</td></tr>'}</tbody><tfoot><tr><td colspan="11" class="total-label">TOTAL — ${records.length} REGISTRO(S)</td>${totals.map((value, index) => `<td${index === 13 || index === 16 ? '' : ' class="num"'}>${escapeHtml(value)}</td>`).join('')}</tr></tfoot></table></div><footer class="footer"><span>Total de registros: ${records.length}</span><span>Gerado em ${escapeHtml(generated)}</span></footer></main></body></html>`;
};

const toIsoDate = (value: string) => {
  const text = value.trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
};

const RelatorioGeral: React.FC = () => {
  const { colors } = useTheme();
  const [cycle, setCycle] = useState('');
  const [year, setYear] = useState('2026');
  const [activity, setActivity] = useState('');
  const [quadra, setQuadra] = useState('');
  const [face, setFace] = useState('');
  const [imovel, setImovel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quarteiroes, setQuarteiroes] = useState<any[]>([]);
  const [faces, setFaces] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [productionOptions, setProductionOptions] = useState<any>({ atividades: [], ciclos: [] });
  const [optionErrors, setOptionErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [dropdown, setDropdown] = useState<{ title: string; options: Option[]; onSelect: (value: string) => void } | null>(null);

  useEffect(() => {
    let active = true;
    const load = async (key: string, request: Promise<any>, setValue: (value: any) => void) => {
      try {
        const value = await request;
        if (!active) return;
        setValue(value);
        setOptionErrors(previous => ({ ...previous, [key]: '' }));
      } catch (error: any) {
        if (active) setOptionErrors(previous => ({ ...previous, [key]: error?.message || 'Não foi possível consultar o banco de dados.' }));
      }
    };
    void load('quarteirao', quarteiraoService.list(), setQuarteiroes);
    void load('face', faceService.list(), setFaces);
    void load('imovel', imovelService.list(), setImoveis);
    void load('producao', producaoService.getOpcoes(), setProductionOptions);
    return () => { active = false; };
  }, []);

  const openDropdown = (title: string, options: Option[], onSelect: (value: string) => void) => setDropdown({ title, options, onSelect });
  const uniqueOptions = (items: any[], idOf: (item: any) => any, labelOf: (item: any) => string): Option[] => {
    const seen = new Set<string>();
    return items.flatMap(item => {
      const id = idOf(item);
      if (id == null || seen.has(String(id))) return [];
      seen.add(String(id));
      return [{ key: String(id), label: labelOf(item), value: String(id) }];
    });
  };
  const quadraOptions = uniqueOptions(quarteiroes, item => item.id_quadra, item => item.nome_quadra || `Quarteirão ${item.id_quadra}`);
  const faceOptions = quadra ? uniqueOptions(faces.filter(item => String(item.id_quarteirao ?? item.id_quadra) === quadra), item => item.id_face, item => `Face ${item.numero_face}`) : [];
  const imovelOptions = face ? uniqueOptions(imoveis.filter(item => {
    const faceId = item.id_face ?? item.face_id;
    return faceId != null ? String(faceId) === face : String(item.id_quarteirao) === quadra;
  }), item => item.id_imovel, item => `${item.nome_logradouro || 'Imóvel'} ${item.numero || item.seq1 || ''}`.trim()) : [];
  const cycleOptions = uniqueOptions((productionOptions.ciclos || []).filter((value: any) => {
    const cycleYear = String(value).match(/(?:19|20)\d{2}/)?.[0];
    return !year || cycleYear === year;
  }), item => item, item => `Ciclo ${String(item).split('/')[0] || String(item)}`);
  const yearOptions = uniqueOptions(
    [...new Set([...((productionOptions.ciclos || []).flatMap((value: any) => String(value).match(/(?:19|20)\d{2}/g) || [])), '2026'])].sort((a, b) => Number(b) - Number(a)),
    item => item,
    item => String(item)
  );
  const activityOptions = uniqueOptions(productionOptions.atividades || [], item => item.id_atividade ?? item.co_atividade ?? item.nome_atividade, item => item.nome_atividade);

  const clear = () => { setCycle(''); setYear('2026'); setActivity(''); setQuadra(''); setFace(''); setImovel(''); setStartDate(''); setEndDate(''); };
  const generate = async () => {
    const dataInicial = toIsoDate(startDate);
    const dataFinal = toIsoDate(endDate);
    if (startDate && !dataInicial) return Alert.alert('Relatório', 'Informe a data inicial no formato dd/mm/aaaa.');
    if (endDate && !dataFinal) return Alert.alert('Relatório', 'Informe a data final no formato dd/mm/aaaa.');
    if (dataInicial && dataFinal && dataInicial > dataFinal) return Alert.alert('Relatório', 'A data inicial deve ser anterior à data final.');
    setGenerating(true);
    try {
      const filters = { ano: year, ciclo: cycle, atividade: activity, quarteirao: quadra, face, imovel, dataInicial, dataFinal };
      const response = await producaoService.getRelatorio(filters);
      const records = Array.isArray(response.registros) ? response.registros : [];
      let logoBase64 = '';
      try {
        const logoAsset = Asset.fromModule(require('../../../assets/logoEcampo.png'));
        await logoAsset.downloadAsync();
        if (logoAsset.localUri) {
          logoBase64 = await FileSystem.readAsStringAsync(logoAsset.localUri, { encoding: FileSystem.EncodingType.Base64 });
        }
      } catch (error) {
        console.warn('Não foi possível carregar o logo no PDF:', error);
      }
      const html = buildReportHtml(records, response, logoBase64, { ...filters, dataInicial, dataFinal });
      const file = await Print.printToFileAsync({ html, width: 842, height: 595 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Relatório de Imóveis Visitados' });
      } else {
        Alert.alert('PDF gerado', `Arquivo salvo em: ${file.uri}`);
      }
    } catch (error: any) {
      Alert.alert('Relatório de Imóveis Visitados', error?.message || 'Não foi possível gerar o PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const field = (label: string, value: string, title: string, options: Option[], onSelect: (selected: string) => void) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity style={[styles.select, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => openDropdown(title, options, onSelect)}>
        <Text style={[styles.selectText, { color: value ? colors.primary : colors.textSecondary }]} numberOfLines={1}>{options.find(option => option.value === value)?.label || (value ? value : 'Selecione')}</Text>
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
          {field('Selecione o ano', year, 'Selecione o ano', yearOptions, value => { setYear(value); setCycle(''); })}
          {field('Selecione o ciclo', cycle, 'Selecione o ciclo', cycleOptions, setCycle)}
          {field('Selecione a Atividade', activity, 'Selecione a atividade', activityOptions, setActivity)}
          {field('Selecione a quadra', quadra, 'Selecione a quadra', quadraOptions, value => { setQuadra(value); setFace(''); setImovel(''); })}
          {field('Selecione a face', face, 'Selecione a face', faceOptions, value => { setFace(value); setImovel(''); })}
          {field('Selecione o imóvel', imovel, 'Selecione o imóvel', imovelOptions, setImovel)}
          <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>Data inicial</Text><TextInput style={[styles.select, styles.dateInput, { borderColor: colors.border, color: colors.primary }]} placeholder="dd/mm/aaaa" placeholderTextColor={colors.textSecondary} value={startDate} onChangeText={setStartDate} /></View>
          <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>Data final</Text><TextInput style={[styles.select, styles.dateInput, { borderColor: colors.border, color: colors.primary }]} placeholder="dd/mm/aaaa" placeholderTextColor={colors.textSecondary} value={endDate} onChangeText={setEndDate} /></View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.actions}><TouchableOpacity style={styles.clearButton} onPress={clear} disabled={generating}><Text style={styles.clearText}>Limpar</Text></TouchableOpacity><TouchableOpacity style={styles.generateButton} onPress={generate} disabled={generating}>{generating ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="document-text-outline" size={18} color="#fff" />}<Text style={styles.generateText}>{generating ? 'Gerando PDF...' : 'Gerar PDF'}</Text></TouchableOpacity></View>
      </View>

      <Modal visible={dropdown !== null} transparent animationType="fade" onRequestClose={() => setDropdown(null)}>
        <View style={styles.overlay}><View style={[styles.dropdown, { backgroundColor: colors.card }]}><View style={styles.dropdownHeader}><Text style={[styles.dropdownTitle, { color: colors.text }]}>{dropdown?.title}</Text><TouchableOpacity onPress={() => setDropdown(null)}><Ionicons name="close" size={23} color={colors.text} /></TouchableOpacity></View><ScrollView>{(dropdown?.options || []).map((option, index) => <TouchableOpacity key={`${option.key}-${index}`} style={[styles.option, { borderBottomColor: colors.border }]} onPress={() => { dropdown?.onSelect(option.value); setDropdown(null); }}><Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text></TouchableOpacity>)}{dropdown?.options.length === 0 && <Text style={[styles.empty, { color: colors.textSecondary }]}>{dropdown?.title === 'Selecione a face' && !quadra ? 'Selecione um quarteirão primeiro.' : dropdown?.title === 'Selecione o imóvel' && !face ? 'Selecione uma face primeiro.' : dropdown?.title === 'Selecione o ciclo' || dropdown?.title === 'Selecione o ano' || dropdown?.title === 'Selecione a atividade' ? optionErrors.producao || 'Nenhuma opção cadastrada no banco de dados.' : dropdown?.title === 'Selecione a quadra' ? optionErrors.quarteirao || 'Nenhum quarteirão cadastrado para este usuário.' : dropdown?.title === 'Selecione a face' ? optionErrors.face || 'Nenhuma face vinculada ao quarteirão.' : dropdown?.title === 'Selecione o imóvel' ? optionErrors.imovel || 'Nenhum imóvel vinculado à face.' : 'Nenhuma opção disponível'}</Text>}</ScrollView></View></View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  card: { width: '100%', maxWidth: 700, alignSelf: 'center', borderRadius: 12, padding: 20, shadowOffset: { width: 0, height: 5 }, shadowOpacity: .12, shadowRadius: 12, elevation: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 86 }, title: { flex: 1, fontSize: 29, fontWeight: '500' }, divider: { height: 1, width: '100%', marginVertical: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 }, field: { flexGrow: 1, flexBasis: '46%', minWidth: 240 }, label: { fontSize: 17, marginBottom: 9 }, select: { minHeight: 46, borderWidth: 1, borderRadius: 5, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectText: { flex: 1, fontSize: 16, fontWeight: '700' }, dateInput: { fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18 }, clearButton: { backgroundColor: '#7E8791', borderRadius: 5, paddingHorizontal: 15, minHeight: 43, justifyContent: 'center' }, generateButton: { backgroundColor: '#087EF5', borderRadius: 5, paddingHorizontal: 16, minHeight: 43, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 8 }, clearText: { color: '#fff', fontSize: 16 }, generateText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', padding: 24 }, dropdown: { maxHeight: '70%', borderRadius: 12, overflow: 'hidden' }, dropdownHeader: { minHeight: 54, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#DDE3ED', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dropdownTitle: { fontSize: 18, fontWeight: '800' }, option: { minHeight: 48, paddingHorizontal: 16, justifyContent: 'center', borderBottomWidth: 1 }, optionText: { fontSize: 16 }, empty: { padding: 18, textAlign: 'center' },
});

export default RelatorioGeral;
