import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { faceService, imovelService, localidadeService, producaoService, quarteiraoService, zonaService } from '../../services/api';
import { addProducaoLocal, listProducaoLocal } from '../../services/producaoLocal';
import { useTheme } from '../../contexts/ThemeContext';
import QuarteiraoMapWebView from '../../components/QuarteiraoMapWebView';

type DropdownOption = { key: string; label: string; value: string };

const parseMapGeoJSON = (value: any, id: string, mapKind: string, color: string) => {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed?.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
      return parsed.features.map((feature: any, index: number) => ({
        ...feature,
        id: `${id}-${index}`,
        properties: { ...(feature.properties || {}), mapKind, color },
      }));
    }
    const feature = parsed?.type === 'Feature'
      ? parsed
      : { type: 'Feature', geometry: parsed, properties: {} };
    if (!feature.geometry) return null;
    return [{
      ...feature,
      id,
      properties: { ...(feature.properties || {}), mapKind, color },
    }];
  } catch {
    return null;
  }
};

const mapCoordinate = (latitude: any, longitude: any) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 ? { lat, lng } : null;
};

const ProducaoInicio: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
  const [opcoesProducao, setOpcoesProducao] = useState<any>({ atividades: [], ciclos: [], tipos: [], zonasConcluidas: [], visitas: [], pendencias: [] });
  const [loadingAtividades, setLoadingAtividades] = useState(false);
  const [dropdownLoadErrors, setDropdownLoadErrors] = useState<Record<string, string>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedZona, setSelectedZona] = useState('');
  const [selectedZonaId, setSelectedZonaId] = useState('');
  const [selectedLocalidade, setSelectedLocalidade] = useState('');
  const [selectedLocalidadeId, setSelectedLocalidadeId] = useState('');
  const [atividade, setAtividade] = useState('');
  const [dataAtividade, setDataAtividade] = useState('15/09/2026');
  const [cicloAno, setCicloAno] = useState('');
  const [tipoAtividade, setTipoAtividade] = useState('');
  const [zonaConcluida, setZonaConcluida] = useState('');
  const [seq, setSeq] = useState('');
  const [horaVisita, setHoraVisita] = useState('08:38 PM');
  const [visita, setVisita] = useState('');
  const [pendencia, setPendencia] = useState('');
  const [amostraInicio, setAmostraInicio] = useState('0');
  const [amostraFim, setAmostraFim] = useState('0');
  const [tubitos, setTubitos] = useState('0');
  const [depositosInspecionados, setDepositosInspecionados] = useState<Record<string, string>>({ a1: '0', a2: '0', b: '0', c: '0', d1: '0', d2: '0', e: '0' });
  const [imovelInspecionado, setImovelInspecionado] = useState('Sim');
  const [depositosEliminados, setDepositosEliminados] = useState('0');
  const [imoveisTratados, setImoveisTratados] = useState('0');
  const [larvicidaTipo, setLarvicidaTipo] = useState('');
  const [larvicidaQtdCarga, setLarvicidaQtdCarga] = useState('0');
  const [larvicidaQtdDepositos, setLarvicidaQtdDepositos] = useState('0');
  const [adulticidaTipo, setAdulticidaTipo] = useState('');
  const [adulticidaQtdCarga, setAdulticidaQtdCarga] = useState('0');
  const [selectedFace, setSelectedFace] = useState<any | null>(null);
  const [selectedImovel, setSelectedImovel] = useState<any | null>(null);

  const loadProductionOptions = useCallback(async () => {
    setLoadingAtividades(true);
    try {
      const options = await producaoService.getOpcoes();
      setOpcoesProducao(options);
    } catch (error: any) {
      Alert.alert('Opções de produção', error?.message || 'Não foi possível carregar as opções cadastradas no banco.');
    } finally {
      setLoadingAtividades(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async (key: string, request: Promise<any>, setValue: (value: any) => void) => {
      try {
        const value = await request;
        if (!active) return;
        setValue(Array.isArray(value) ? value : []);
        setDropdownLoadErrors(previous => ({ ...previous, [key]: '' }));
      } catch (error: any) {
        if (!active) return;
        setDropdownLoadErrors(previous => ({ ...previous, [key]: error?.message || 'Falha ao consultar o servidor.' }));
      }
    };
    void load('quarteirao', quarteiraoService.list(), setQuarteiroes);
    void load('face', faceService.list(), setFaces);
    void load('imovel', imovelService.list(), setImoveis);
    void load('zona', zonaService.list(), setZonas);
    void load('localidade', localidadeService.list(), setLocalidades);
    void load('entries', listProducaoLocal(), setEntries);
    void loadProductionOptions();
    return () => { active = false; };
  }, [loadProductionOptions]);

  const save = async () => {
    if (!selected || !(atividade.trim() || cultura.trim()) || !(cicloAno.trim() || safra.trim())) {
      Alert.alert('Produção', 'Selecione um quarteirão e informe a atividade e o ciclo/ano.');
      return;
    }

    const selectedActivity = opcoesProducao.atividades.find((item: any) => item.nome_atividade === atividade);
    if (!selectedActivity?.id_atividade) {
      Alert.alert('Produção', 'Selecione uma atividade cadastrada no banco de dados.');
      return;
    }
    const dateParts = dataAtividade.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const dateIso = dateParts ? `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}` : dataAtividade.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
      Alert.alert('Produção', 'Informe a data da atividade no formato dd/mm/aaaa.');
      return;
    }
    const productionPayload = {
      id_quarteirao: Number(selected.id_quadra),
      seq: seq ? Number.parseInt(seq, 10) : null,
      id_face: selectedFace ? Number(selectedFace.id_face) : null,
      id_imovel: selectedImovel ? Number(selectedImovel.id_imovel) : null,
      hora_visita: horaVisita || null,
      visita_n_r: visita || null,
      pendencia: pendencia || null,
      imovel_insp: imovelInspecionado === 'Sim' || imovelInspecionado === '1' ? '1' : '0',
      nu_amostra_ini: Number.parseInt(amostraInicio, 10) || 0,
      nu_amostra_fim: Number.parseInt(amostraFim, 10) || 0,
      qtd_tubitos: Number.parseInt(tubitos, 10) || 0,
      depositos_eliminados: Number.parseInt(depositosEliminados, 10) || 0,
      a1: Number.parseInt(depositosInspecionados.a1, 10) || 0,
      a2: Number.parseInt(depositosInspecionados.a2, 10) || 0,
      b: Number.parseInt(depositosInspecionados.b, 10) || 0,
      c: Number.parseInt(depositosInspecionados.c, 10) || 0,
      d1: Number.parseInt(depositosInspecionados.d1, 10) || 0,
      d2: Number.parseInt(depositosInspecionados.d2, 10) || 0,
      e: Number.parseInt(depositosInspecionados.e, 10) || 0,
      imoveis_tratados: Number.parseInt(imoveisTratados, 10) || 0,
      larvicida_tipo: larvicidaTipo || null,
      larvicida_qtd_carga: Number.parseInt(larvicidaQtdCarga, 10) || 0,
      larvicida_qtd_dep_trat: Number.parseInt(larvicidaQtdDepositos, 10) || 0,
      adulticida_tipo: adulticidaTipo || null,
      adulticida_qtd_carga: Number.parseInt(adulticidaQtdCarga, 10) || 0,
      id_zona: selectedZonaId ? Number(selectedZonaId) : selected.id_zona ?? null,
      atividade: String(selectedActivity.id_atividade),
      data_atividade: dateIso,
      ciclo_ano: cicloAno,
      cabecalho_tipo: tipoAtividade || null,
      cabecalho_zona_concluida: zonaConcluida || null,
      id_localidade: selectedLocalidadeId ? Number(selectedLocalidadeId) : selected.id_localidade ?? null,
      latitude: mapAnchor?.lat == null ? null : String(mapAnchor.lat),
      longitude: mapAnchor?.lng == null ? null : String(mapAnchor.lng),
    };

    await addProducaoLocal({
      quarteiraoId: Number(selected.id_quadra),
      quarteiraoNome: selected.nome_quadra || selected.nome || `Quarteirão ${selected.id_quadra}`,
      cultura: atividade.trim() || cultura.trim(),
      safra: cicloAno.trim() || safra.trim(),
      areaPlantada,
      quantidade,
      valor,
      payload: productionPayload,
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
    Alert.alert('Produção', 'Registro salvo no aparelho. Ele será enviado ao servidor na próxima sincronização.');
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
  const getEntityId = (key: string, item: any) => {
    const idByEntity: Record<string, unknown> = {
      zona: item.id_zona,
      localidade: item.id_localidade,
      atividade: item.id_atividade ?? item.co_atividade,
      quarteirao: item.id_quadra ?? item.id_quarteirao ?? item.id,
      face: item.id_face ?? item.id,
      imovel: item.id_imovel ?? item.id,
    };
    return idByEntity[key];
  };
  const entityOptions = (key: string, items: any[], getLabel: (item: any) => string, appendIdToDuplicateLabels = true): DropdownOption[] => {
    const seenValues = new Set<string>();
    const uniqueItems = items.filter(item => {
      const entityId = getEntityId(key, item);
      const value = entityId == null ? '' : String(entityId);
      if (value === 'undefined' || value === 'null' || seenValues.has(value)) return false;
      if (!value) return false;
      seenValues.add(value);
      return true;
    });
    const labels = uniqueItems.map(getLabel);
    const counts = labels.reduce<Record<string, number>>((result, label) => ({ ...result, [label]: (result[label] || 0) + 1 }), {});
    return uniqueItems.map((item, index) => {
      const value = String(getEntityId(key, item));
      const label = labels[index];
      return { key: `${key}-${value}-${index}`, value, label: appendIdToDuplicateLabels && counts[label] > 1 ? `${label} · #${value}` : label };
    });
  };
  const valueOptions = (key: string, values: string[] = []): DropdownOption[] => values.map((value, index) => ({ key: `${key}-${index}-${value}`, label: String(value), value: String(value) }));
  const yesNoOptions = (key: string): DropdownOption[] => [
    { key: `${key}-1`, label: 'Sim', value: '1' },
    { key: `${key}-0`, label: 'Não', value: '0' },
  ];
  const simNaoLabel = (value: string) => value === '1' ? 'Sim' : value === '0' ? 'Não' : value;
  const firstName = (name: unknown) => String(name ?? '').trim().split(/\s+/)[0] || '';
  const formatImovelLabel = (imovel: any) => {
    const numero = String(imovel.numero ?? '').trim() || String(imovel.seq1 ?? '').trim();
    const rua = String(imovel.nome_logradouro ?? '').trim();
    const identificador = numero ? `Nº ${numero}` : 'Imóvel';
    const responsavel = firstName(imovel.resp ?? imovel.responsavel);
    return [identificador, rua, responsavel].filter(Boolean).join(' · ');
  };
  const firstNameOrDash = (name: unknown) => firstName(name) || '-';
  const scopedLocalidades = localidades.filter(item => !selectedZonaId || item.id_zona == null || String(item.id_zona) === selectedZonaId);
  const scopedQuarteiroes = quarteiroes.filter(item =>
    (!selectedZonaId || item.id_zona == null || String(item.id_zona) === selectedZonaId) &&
    (!selectedLocalidadeId || item.id_localidade == null || String(item.id_localidade) === selectedLocalidadeId)
  );
  const dropdownOptions: Record<string, DropdownOption[]> = {
    zona: entityOptions('zona', zonas.filter(item => item.nome_zona), item => item.nome_zona),
    localidade: entityOptions('localidade', scopedLocalidades.filter(item => item.nome_localidade), item => item.nome_localidade),
    atividade: (opcoesProducao.atividades || []).map((item: any) => ({ key: `atividade-${item.id_atividade}`, label: item.nome_atividade, value: item.nome_atividade })),
    ciclo: valueOptions('ciclo', opcoesProducao.ciclos),
    tipo: yesNoOptions('tipo'),
    concluida: yesNoOptions('concluida'),
    visita: valueOptions('visita', opcoesProducao.visitas),
    pendencia: valueOptions('pendencia', opcoesProducao.pendencias),
    quarteirao: entityOptions('quarteirao', scopedQuarteiroes, item => `${item.nome_quadra || 'Quarteirão'} · Nº ${item.numero_quadra ?? item.id_quadra}`),
    face: selected ? entityOptions('face', faces.filter(face => String(face.id_quarteirao ?? face.id_quadra ?? face.quarteirao_id) === String(selected.id_quadra)), face => `Face ${face.numero_face ?? face.nome_face ?? face.id_face}`) : [],
    imovel: selectedFace ? entityOptions('imovel', imoveis.filter(imovel => {
      const faceId = imovel.id_face ?? imovel.face_id;
      if (faceId != null) return String(faceId) === String(selectedFace.id_face);
      return String(imovel.id_quarteirao) === String(selected?.id_quadra);
    }), imovel => `${formatImovelLabel(imovel)}${imovel.id_face == null && imovel.face_id == null ? ' · sem face vinculada' : ''}`, false) : [],
    imovelInspecionado: [
      { key: 'imovelInspecionado-1', label: 'Sim', value: '1' },
      { key: 'imovelInspecionado-0', label: 'Não', value: '0' },
    ],
    larvicida: (opcoesProducao.larvicidas || []).map((item: any, index: number) => {
      const nome = String(typeof item === 'string' ? item : item.nome_larvicida ?? item.nome ?? '').trim();
      const tipo = String(item.tipo_larvicida ?? item.tipo ?? '').trim();
      const label = [nome, tipo].filter(Boolean).join(' · ');
      return { key: `larvicida-${typeof item === 'string' ? index : item.id_larvicida ?? index}`, label, value: label };
    }).filter((option: DropdownOption) => option.label),
    adulticida: valueOptions('adulticida', opcoesProducao.adulticidas),
  };
  const dropdownTitles: Record<string, string> = { zona: 'Selecione a zona', localidade: 'Selecione a localidade', atividade: 'Selecione a atividade', ciclo: 'Selecione o ciclo/ano', tipo: 'Selecione o tipo', concluida: 'Zona concluída?', visita: 'Visita (N/R)', pendencia: 'Pendência', quarteirao: 'Selecione o quarteirão', face: 'Selecione a face', imovel: 'Selecione o imóvel', imovelInspecionado: 'Imóvel Inspecionado', larvicida: 'Larvicida Tipo', adulticida: 'Adulticida Tipo' };
  const isLevantamento = /^LI(?:\+T)?\s*[-–]/i.test(atividade.trim()) || atividade.toLocaleLowerCase('pt-BR').includes('levantamento');
  const mapQuarteiroes = selected ? [selected] : (selectedZonaId || selectedLocalidadeId ? scopedQuarteiroes : []);
  const mapFeatures = mapQuarteiroes.flatMap(quarteirao => {
    const polygon = parseMapGeoJSON(quarteirao.poligono_geojson ?? quarteirao.geojson, `quarteirao-${quarteirao.id_quadra}`, 'quarteirao', quarteirao.cor_poligono || '#3388ff');
    if (polygon?.length) return polygon;
    const center = mapCoordinate(quarteirao.latitude_quadra ?? quarteirao.latitude, quarteirao.longitude_quadra ?? quarteirao.longitude);
    return center ? [{ type: 'Feature', id: `quarteirao-${quarteirao.id_quadra}-center`, geometry: { type: 'Point', coordinates: [center.lng, center.lat] }, properties: { mapKind: 'quarteirao', color: quarteirao.cor_poligono || '#3388ff' } }] : [];
  });
  if (selectedFace) {
    const faceGeometry = parseMapGeoJSON(selectedFace.linha_geojson, `face-${selectedFace.id_face}`, 'face', '#f59e0b');
    if (faceGeometry?.length) mapFeatures.push(...faceGeometry);
    else {
      const center = mapCoordinate(selectedFace.latitude, selectedFace.longitude);
      if (center) mapFeatures.push({ type: 'Feature', id: `face-${selectedFace.id_face}-center`, geometry: { type: 'Point', coordinates: [center.lng, center.lat] }, properties: { mapKind: 'face', color: '#f59e0b' } });
    }
  }
  if (selectedImovel) {
    const center = mapCoordinate(selectedImovel.latitude, selectedImovel.longitude);
    if (center) mapFeatures.push({ type: 'Feature', id: `imovel-${selectedImovel.id_imovel}`, geometry: { type: 'Point', coordinates: [center.lng, center.lat] }, properties: { mapKind: 'imovel', color: '#e11d48' } });
  }
  const mapAnchor = selectedImovel
    ? mapCoordinate(selectedImovel.latitude, selectedImovel.longitude)
    : selectedFace
      ? mapCoordinate(selectedFace.latitude, selectedFace.longitude)
      : selected
        ? mapCoordinate(selected.latitude_quadra, selected.longitude_quadra)
        : mapQuarteiroes.map(item => mapCoordinate(item.latitude_quadra, item.longitude_quadra)).find(Boolean) || null;
  const mapInitialPolygon = mapFeatures.length ? { type: 'FeatureCollection', features: mapFeatures } : null;
  const mapKey = `atividade-map-${selectedZonaId}-${selectedLocalidadeId}-${selected?.id_quadra || ''}-${selectedFace?.id_face || ''}-${selectedImovel?.id_imovel || ''}`;
  const openDropdown = (key: string) => {
    setActiveDropdown(key);
    if (key === 'atividade' && !loadingAtividades && opcoesProducao.atividades.length === 0) {
      void loadProductionOptions();
    }
  };
  const selectDropdownValue = (option: DropdownOption) => {
    const { value, label } = option;
    if (activeDropdown === 'zona') {
      setSelectedZona(label);
      setSelectedZonaId(value);
      setSelectedLocalidade('');
      setSelectedLocalidadeId('');
      setSelected(null);
      setSelectedFace(null);
      setSelectedImovel(null);
    }
    if (activeDropdown === 'localidade') {
      setSelectedLocalidade(label);
      setSelectedLocalidadeId(value);
      setSelected(null);
      setSelectedFace(null);
      setSelectedImovel(null);
    }
    if (activeDropdown === 'atividade') setAtividade(label);
    if (activeDropdown === 'ciclo') setCicloAno(value);
    if (activeDropdown === 'tipo') setTipoAtividade(value);
    if (activeDropdown === 'concluida') setZonaConcluida(value);
    if (activeDropdown === 'visita') setVisita(value);
    if (activeDropdown === 'pendencia') setPendencia(value);
    if (activeDropdown === 'imovelInspecionado') setImovelInspecionado(label);
    if (activeDropdown === 'larvicida') setLarvicidaTipo(value);
    if (activeDropdown === 'adulticida') setAdulticidaTipo(value);
    if (activeDropdown === 'quarteirao') {
      const quarteirao = quarteiroes.find(item => String(item.id_quadra ?? item.id_quarteirao ?? item.id) === value);
      if (quarteirao) { setSelected(quarteirao); setSelectedFace(null); setSelectedImovel(null); }
    }
    if (activeDropdown === 'face') {
      const face = faces.find(item => String(item.id_face ?? item.id) === value && (!selected || String(item.id_quarteirao ?? item.id_quadra ?? item.quarteirao_id) === String(selected.id_quadra ?? selected.id_quarteirao ?? selected.id)));
      if (face) { setSelectedFace(face); setSelectedImovel(null); }
    }
    if (activeDropdown === 'imovel') {
      const imovel = imoveis.find(item => {
        if (String(item.id_imovel ?? item.id) !== value) return false;
        const faceId = item.id_face ?? item.face_id;
        return faceId != null
          ? String(faceId) === String(selectedFace?.id_face)
          : String(item.id_quarteirao) === String(selected?.id_quadra);
      });
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
          <Ionicons name="document-text-outline" size={20} color="#fff" /><Text style={styles.actionText}>PDF das Atividades do Dia</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        {metrics.map(([label, value, icon, color]) => <View key={label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View><Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text><Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text></View><Ionicons name={icon as any} size={29} color={color} /></View>)}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}><Ionicons name="grid-outline" size={18} color={colors.text} /><Text style={[styles.sectionTitle, { color: colors.text }]}>Produção de hoje</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableContent}>
          <View>
            <View style={styles.tableRow}>{['Zona', 'Localidade', 'Quarteirão', 'Seq', 'Face', 'Logradouro', 'Nº', 'Seq Imóvel', 'Complemento', 'Tipo', 'Hora', 'Visita', 'Pendência', 'A1', 'A2', 'B', 'C', 'D1', 'D2'].map(column => <Text key={column} style={[styles.tableHeader, { color: colors.text }]}>{column}</Text>)}</View>
            {entries.length === 0 ? <Text style={[styles.emptyTable, { color: colors.textSecondary }]}>Nenhum registro encontrado</Text> : entries.map(entry => <View key={entry.id} style={styles.tableRow}><Text style={[styles.tableCell, { color: colors.text }]}>{entry.quarteiraoNome}</Text><Text style={[styles.tableCell, { color: colors.text }]}>{entry.cultura}</Text><Text style={[styles.tableCell, { color: colors.text }]}>{entry.safra}</Text></View>)}
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
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={25} color={colors.onPrimary} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={[styles.activityBody, { backgroundColor: colors.card }]} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldGrid}>
                <View style={styles.field}><Text style={styles.fieldLabel}>Selecione a zona</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('zona')}><Text style={styles.selectValue} numberOfLines={1}>{selectedZona || selected?.nome_zona || 'Selecione uma zona'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Selecione a Localidade</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('localidade')}><Text style={styles.selectValue} numberOfLines={1}>{selectedLocalidade || selected?.nome_localidade || 'Selecione uma localidade'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Atividade</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('atividade')}><Text style={styles.selectValue}>{atividade || 'Selecione a atividade'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Data Atividade</Text><TextInput style={styles.activityInput} value={dataAtividade} onChangeText={setDataAtividade} /></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Ciclo/Ano</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('ciclo')}><Text style={styles.selectValue}>{cicloAno || 'Selecione o ciclo/ano'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Tipo</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('tipo')}><Text style={styles.selectValue}>{tipoAtividade ? simNaoLabel(tipoAtividade) : 'Selecione o tipo'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                <View style={styles.field}><Text style={styles.fieldLabel}>Zona Concluída?</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('concluida')}><Text style={styles.selectValue}>{zonaConcluida ? simNaoLabel(zonaConcluida) : 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
              </View>

              <View style={styles.activityPanel}>
                <View style={styles.fieldGrid}>
                  <View style={[styles.field, styles.quadField]}><Text style={styles.fieldLabel}>Selecione o quarteirão</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('quarteirao')}><Text style={styles.selectValue} numberOfLines={1}>{selected ? `${selected.nome_quadra || 'Quarteirão'} · Nº ${selected.numero_quadra ?? selected.id_quadra}` : 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                  <View style={[styles.field, styles.seqField]}><Text style={styles.fieldLabel}>Seq</Text><TextInput style={styles.activityInput} value={seq} onChangeText={setSeq} keyboardType="numeric" /></View>
                  <View style={[styles.field, styles.faceField]}><Text style={styles.fieldLabel}>Selecione a face</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('face')}><Text style={styles.selectValue} numberOfLines={1}>{selectedFace ? `Face ${selectedFace.numero_face}` : 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                  <View style={[styles.field, styles.imovelField]}><Text style={styles.fieldLabel}>Selecione o imóvel</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('imovel')}><Text style={styles.selectValue} numberOfLines={1}>{selectedImovel ? formatImovelLabel(selectedImovel) : 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                </View>
                <View style={styles.propertyBox}><Text style={styles.propertyTitle}>DADOS DO IMÓVEL SELECIONADO</Text><View style={styles.propertyGrid}>{[['LOGRADOURO', selectedImovel?.nome_logradouro || 'Selecione um imóvel'], ['NÚMERO', selectedImovel?.numero || '-'], ['RESPONSÁVEL', firstNameOrDash(selectedImovel?.resp ?? selectedImovel?.responsavel)], ['SEQ. IMÓVEL', selectedImovel?.seq || '-'], ['COMPLEMENTO', selectedImovel?.complemento || '-'], ['TIPO', selectedImovel?.tipo || '-']].map(([label, value]) => <View key={label} style={styles.property}><Text style={styles.propertyLabel}>{label}</Text><Text style={styles.propertyValue}>{value}</Text></View>)}</View></View>
                <View style={styles.fieldGrid}><View style={styles.field}><Text style={styles.fieldLabel}>Hora Visita</Text><TextInput style={styles.activityInput} value={horaVisita} onChangeText={setHoraVisita} /></View><View style={styles.field}><Text style={styles.fieldLabel}>Visita (N/R)</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('visita')}><Text style={styles.selectValue}>{visita || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View><View style={styles.field}><Text style={styles.fieldLabel}>Pendência</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('pendencia')}><Text style={styles.selectValue}>{pendencia || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View></View>
              </View>

              {isLevantamento && <View style={styles.depositsBox}>
                <Text style={styles.subsectionTitle}>Nº de Depósitos Inspecionados</Text>
                <View style={styles.fieldGrid}>
                  {([['a1', 'A1'], ['a2', 'A2'], ['b', 'B'], ['c', 'C'], ['d1', 'D1'], ['d2', 'D2'], ['e', 'E']] as const).map(([key, label]) => <View key={key} style={[styles.field, styles.depositInputField]}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.activityInput} value={depositosInspecionados[key]} onChangeText={value => setDepositosInspecionados(current => ({ ...current, [key]: value.replace(/[^0-9]/g, '') }))} keyboardType="numeric" /></View>)}
                  <View style={[styles.field, styles.inspectedField]}><Text style={styles.fieldLabel}>Imóvel Inspecionado</Text><TouchableOpacity style={styles.select} onPress={() => openDropdown('imovelInspecionado')}><Text style={styles.selectValue}>{imovelInspecionado}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                </View>
              </View>}
              <Text style={styles.subsectionTitle}>Coleta Amostra</Text>
              <View style={styles.sampleBox}><Text style={styles.sampleTitle}>Nº da amostra</Text><View style={styles.fieldGrid}><View style={styles.field}><Text style={styles.fieldLabel}>Nº Amostra Início</Text><TextInput style={styles.activityInput} value={amostraInicio} onChangeText={setAmostraInicio} keyboardType="numeric" /></View><View style={styles.field}><Text style={styles.fieldLabel}>Nº Amostra Fim</Text><TextInput style={styles.activityInput} value={amostraFim} onChangeText={setAmostraFim} keyboardType="numeric" /></View><View style={styles.field}><Text style={styles.fieldLabel}>Qtd Tubitos</Text><TextInput style={styles.activityInput} value={tubitos} onChangeText={setTubitos} keyboardType="numeric" /></View></View></View>
              {atividade.trim().toLocaleUpperCase('pt-BR').startsWith('LI+T') && <View style={styles.treatmentBox}>
                <Text style={styles.treatmentTitle}>Tratamento</Text>
                <View style={styles.treatmentTopRow}>
                  <View style={styles.treatmentHalf}>
                    <View style={styles.treatmentFields}>
                      <View style={styles.treatmentField}><Text style={styles.treatmentLabel}>Depósitos Eliminados</Text><TextInput style={styles.treatmentInput} value={depositosEliminados} onChangeText={setDepositosEliminados} keyboardType="numeric" /></View>
                      <View style={styles.treatmentField}><Text style={styles.treatmentLabel}>Imóveis Tratados</Text><TextInput style={styles.treatmentInput} value={imoveisTratados} onChangeText={setImoveisTratados} keyboardType="numeric" /></View>
                    </View>
                  </View>
                </View>
                <View style={styles.treatmentProductsRow}>
                  <View style={styles.treatmentProductGroup}>
                    <Text style={styles.treatmentProductTitle}>Larvicida</Text>
                    <View style={styles.treatmentFields}>
                      <View style={[styles.treatmentField, styles.treatmentSelectField]}><Text style={styles.treatmentLabel}>Larvicida Tipo</Text><TouchableOpacity style={styles.treatmentSelect} onPress={() => openDropdown('larvicida')}><Text style={styles.selectValue} numberOfLines={1}>{larvicidaTipo || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                      <View style={styles.treatmentField}><Text style={styles.treatmentLabel}>Qtd Carga</Text><TextInput style={styles.treatmentInput} value={larvicidaQtdCarga} onChangeText={setLarvicidaQtdCarga} keyboardType="numeric" /></View>
                      <View style={styles.treatmentField}><Text style={styles.treatmentLabel}>Qtd Depo. trat.</Text><TextInput style={styles.treatmentInput} value={larvicidaQtdDepositos} onChangeText={setLarvicidaQtdDepositos} keyboardType="numeric" /></View>
                    </View>
                  </View>
                  <View style={styles.treatmentProductGroup}>
                    <Text style={styles.treatmentProductTitle}>Adulticida</Text>
                    <View style={styles.treatmentFields}>
                      <View style={[styles.treatmentField, styles.treatmentSelectField]}><Text style={styles.treatmentLabel}>Adulticida Tipo</Text><TouchableOpacity style={styles.treatmentSelect} onPress={() => openDropdown('adulticida')}><Text style={styles.selectValue} numberOfLines={1}>{adulticidaTipo || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} /></TouchableOpacity></View>
                      <View style={styles.treatmentField}><Text style={styles.treatmentLabel}>Qtd Carga</Text><TextInput style={styles.treatmentInput} value={adulticidaQtdCarga} onChangeText={setAdulticidaQtdCarga} keyboardType="numeric" /></View>
                    </View>
                  </View>
                </View>
              </View>}
              <View style={styles.mapPanel}>
                <TouchableOpacity style={styles.locationButton} onPress={() => Alert.alert('Localização', 'A localização atual será usada quando o GPS estiver disponível.')}><Ionicons name="navigate" size={18} color={colors.location} /><Text style={styles.locationText}>Detectar Localização Atual</Text></TouchableOpacity>
                <Text style={styles.coordinates}>{mapAnchor ? `Lat: ${mapAnchor.lat.toFixed(6)} | Lon: ${mapAnchor.lng.toFixed(6)}` : 'Selecione zona, localidade, quarteirão, face ou imóvel para posicionar o mapa.'}</Text>
                <QuarteiraoMapWebView key={mapKey} initialPolygon={mapInitialPolygon} initialCenter={mapAnchor || { lat: -8.3797, lng: -35.4508 }} interactive={false} height={280} />
              </View>
            </ScrollView>
            <View style={styles.activityFooter}><TouchableOpacity style={styles.cancelActivity} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.saveActivity} onPress={save}><Ionicons name="save" size={17} color={colors.onPrimary} /><Text style={styles.saveText}>Salvar</Text></TouchableOpacity></View>
          </View>
        </View>
      </Modal>
      <Modal visible={activeDropdown !== null} transparent animationType="fade" onRequestClose={() => setActiveDropdown(null)}>
        <View style={styles.dropdownOverlay}>
          <View style={[styles.dropdownModal, { backgroundColor: colors.card }]}>
            <View style={styles.dropdownHeader}><Text style={[styles.dropdownTitle, { color: colors.text }]}>{activeDropdown ? dropdownTitles[activeDropdown] : ''}</Text><TouchableOpacity onPress={() => setActiveDropdown(null)}><Ionicons name="close" size={22} color={colors.text} /></TouchableOpacity></View>
            <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
              {(activeDropdown ? dropdownOptions[activeDropdown] || [] : []).map(option => <TouchableOpacity key={option.key} style={[styles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => selectDropdownValue(option)}><Text style={[styles.dropdownItemText, { color: colors.text }]}>{option.label}</Text><Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /></TouchableOpacity>)}
              {activeDropdown && (dropdownOptions[activeDropdown] || []).length === 0 && <Text style={[styles.dropdownEmpty, { color: colors.textSecondary }]}>{activeDropdown === 'atividade' && loadingAtividades ? 'Carregando atividades...' : activeDropdown === 'atividade' ? 'O servidor não retornou atividades da tabela tb_atividades' : activeDropdown === 'face' && !selected ? 'Selecione um quarteirão primeiro.' : activeDropdown === 'imovel' && !selectedFace ? 'Selecione uma face primeiro.' : dropdownLoadErrors[activeDropdown] || (activeDropdown === 'quarteirao' && !quarteiroes.length ? 'Nenhum quarteirão cadastrado para este usuário.' : activeDropdown === 'face' && !faces.length ? 'Nenhuma face cadastrada para este usuário.' : activeDropdown === 'imovel' && !imoveis.length ? 'Nenhum imóvel cadastrado para este usuário.' : activeDropdown === 'face' ? 'Não há faces vinculadas a este quarteirão.' : activeDropdown === 'imovel' ? 'Não há imóveis vinculados a esta face.' : 'Nenhuma opção disponível')}</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
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
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 38, alignItems: 'center' },
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
  activityHeader: { minHeight: 58, backgroundColor: colors.primary, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityTitle: { color: colors.onPrimary, fontSize: 21, fontWeight: '500' },
  activityBody: { padding: 20, gap: 20 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  field: { flexGrow: 1, flexBasis: '22%', minWidth: 150 },
  quadField: { flexBasis: '23%' },
  seqField: { flexBasis: '8%', minWidth: 75 },
  faceField: { flexBasis: '27%' },
  imovelField: { flexBasis: '30%' },
  fieldLabel: { color: colors.text, fontSize: 16, marginBottom: 7 },
  select: { minHeight: 46, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { color: colors.primary, fontSize: 16, fontWeight: '700', flex: 1 },
  activityInput: { minHeight: 46, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 14, color: colors.primary, fontSize: 16, fontWeight: '600' },
  readonly: { backgroundColor: colors.background },
  activityPanel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, gap: 18 },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionTextSelected: { color: colors.onPrimary },
  propertyBox: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  propertyTitle: { color: colors.primary, fontSize: 14, fontWeight: '800', marginBottom: 10 },
  propertyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  property: { flexGrow: 1, flexBasis: '17%', minWidth: 125, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 10 },
  propertyLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 5 },
  propertyValue: { color: colors.text, fontWeight: '700' },
  subsectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sampleBox: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 10 },
  depositsBox: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 10 },
  treatmentBox: { backgroundColor: '#EEE5FC', borderWidth: 1, borderColor: '#D7C8F2', borderRadius: 9, padding: 6, gap: 4 },
  treatmentTitle: { color: colors.text, fontSize: 13, fontWeight: '700', paddingHorizontal: 4 },
  treatmentTopRow: { borderWidth: 1, borderColor: '#D7C8F2', padding: 8, flexDirection: 'row' },
  treatmentHalf: { width: '52%' },
  treatmentFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  treatmentField: { flex: 1, minWidth: 105 },
  treatmentSelectField: { flex: 2, minWidth: 180 },
  treatmentLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 5 },
  treatmentInput: { height: 34, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 5, paddingHorizontal: 9, color: colors.primary, fontSize: 14, fontWeight: '600' },
  treatmentSelect: { height: 34, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 5, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center' },
  treatmentProductsRow: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#D7C8F2' },
  treatmentProductGroup: { flex: 1, minWidth: 300, padding: 6, gap: 4 },
  treatmentProductTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  depositInputField: { flexGrow: 0, flexBasis: '10%', minWidth: 78 },
  inspectedField: { flexGrow: 1, flexBasis: '30%', minWidth: 220 },
  sampleTitle: { color: colors.text, fontSize: 17, fontWeight: '500' },
  mapPanel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 12, gap: 8 },
  locationButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.location, borderRadius: 5, minHeight: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { color: colors.location, fontSize: 15 },
  coordinates: { color: colors.textSecondary, fontSize: 13 },
  activityFooter: { minHeight: 64, borderTopWidth: 1, borderTopColor: colors.border, padding: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelActivity: { minWidth: 100, minHeight: 42, borderRadius: 7, backgroundColor: colors.offline, justifyContent: 'center', alignItems: 'center' },
  saveActivity: { minWidth: 110, minHeight: 42, borderRadius: 7, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 7 },
  cancelText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', padding: 22 },
  dropdownModal: { maxHeight: '70%', borderRadius: 14, overflow: 'hidden' },
  dropdownHeader: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
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
