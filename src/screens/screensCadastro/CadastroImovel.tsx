import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { imovelService, quarteiraoService, faceService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { addImovelLocal, listImoveisLocais } from '../../services/imovelLocal';
import QuarteiraoMapWebView from '../../components/QuarteiraoMapWebView';

interface Imovel {
  id_imovel: number;
  seq1: number;
  id_face: number;
  numero_face: number;
  nome_quadra: string;
  numero_quadra: number;
  nome_logradouro: string;
  numero: string;
  seq: string;
  tipo: string;
  status: 'Ativo' | 'Inativo';
}

const TIPOS_IMOVEL = ['R-Residência', 'C-Comércio', 'T-Terreno baldio', 'Outro'];

const DropdownField: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <View style={styles.dropdownWrapper}>
    <TouchableOpacity style={styles.dropdownField} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.dropdownLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.dropdownArrow}>⌄</Text>
    </TouchableOpacity>
  </View>
);

const DropdownOption: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({ label, selected, onPress }) => (
  <TouchableOpacity style={styles.dropdownOption} onPress={onPress}>
    <Text style={[styles.dropdownOptionText, selected && styles.dropdownOptionSelected]}>{selected ? '✓ ' : ''}{label}</Text>
  </TouchableOpacity>
);

const CadastroImovel: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [imovelEditando, setImovelEditando] = useState<Imovel | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [opcoesItensPorPagina] = useState([5, 10, 20, 50]);
  
  const [formData, setFormData] = useState({
    id_quarteirao: '',
    seq1: '',
    id_face: '',
    nome_logradouro: '',
    numero: '',
    seq: '',
    tipo: 'R-Residência',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [quarteiroes, setQuarteiroes] = useState<any[]>([]);
  const [faces, setFaces] = useState<any[]>([]);
  const [facesFiltradas, setFacesFiltradas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<'quarteirao' | 'face' | 'tipo' | 'status' | null>(null);

  const imoveisFiltrados = imoveis.filter(imovel =>
    (imovel.nome_logradouro || '').toLowerCase().includes(busca.toLowerCase()) ||
    (imovel.numero || '').toLowerCase().includes(busca.toLowerCase()) ||
    (imovel.nome_quadra || '').toLowerCase().includes(busca.toLowerCase())
  );
  const quarteiraoSelecionado = quarteiroes.find((q) => q.id_quadra.toString() === formData.id_quarteirao);
  const poligonoBruto = quarteiraoSelecionado?.poligono_geojson || quarteiraoSelecionado?.geojson;
  const poligonoSelecionado = typeof poligonoBruto === 'string'
    ? (() => { try { return JSON.parse(poligonoBruto); } catch { return null; } })()
    : poligonoBruto || null;
  const centroQuarteirao = {
    lat: Number(quarteiraoSelecionado?.latitude_quadra ?? quarteiraoSelecionado?.latitude) || -8.3797,
    lng: Number(quarteiraoSelecionado?.longitude_quadra ?? quarteiraoSelecionado?.longitude) || -35.4508,
  };

  const totalItens = imoveisFiltrados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  
  useEffect(() => {
    if (paginaAtual > totalPaginas && totalPaginas > 0) {
      setPaginaAtual(totalPaginas);
    }
  }, [totalItens, itensPorPagina]);

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const imoveisPagina = imoveisFiltrados.slice(inicio, fim);

  const carregarImoveis = async () => {
    try {
      setLoading(true);
      const data = await imovelService.list();
      setImoveis(data);
      setPaginaAtual(1);
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
      const locais = await listImoveisLocais();
      setImoveis(locais.map((imovel, index) => ({
        ...imovel,
        id_imovel: -(index + 1),
        seq1: imovel.seq1,
        nome_quadra: 'Quarteirão local',
        numero_quadra: 0,
        numero_face: 0,
      })));
      setPaginaAtual(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const carregarQuarteiroes = async () => {
    try {
      const data = await quarteiraoService.list();
      setQuarteiroes(data);
    } catch (error) {
      console.error('Erro ao carregar quarteirões:', error);
    }
  };

  const carregarFaces = async () => {
    try {
      const data = await faceService.list();
      setFaces(data);
    } catch (error) {
      console.error('Erro ao carregar faces:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([carregarImoveis(), carregarQuarteiroes(), carregarFaces()]);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (formData.id_quarteirao) {
      const facesDoQuarteirao = faces.filter(f => f.id_quarteirao === parseInt(formData.id_quarteirao));
      setFacesFiltradas(facesDoQuarteirao);
      if (facesDoQuarteirao.length > 0 && !editando) {
        setFormData(prev => ({ ...prev, id_face: facesDoQuarteirao[0].id_face.toString() }));
      }
    } else {
      setFacesFiltradas([]);
    }
  }, [formData.id_quarteirao, faces]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarImoveis();
  };

  const abrirModalCadastro = () => {
    setEditando(false);
    setImovelEditando(null);
    setFormData({
      id_quarteirao: quarteiroes.length > 0 ? quarteiroes[0].id_quadra.toString() : '',
      seq1: '',
      id_face: '',
      nome_logradouro: '',
      numero: '',
      seq: '',
      tipo: 'R-Residência',
      status: 'Ativo',
    });
    setDropdownAberto(null);
    setModalVisible(true);
  };

  const abrirModalEdicao = (imovel: Imovel) => {
    setEditando(true);
    setImovelEditando(imovel);
    
    const face = faces.find(f => f.id_face === imovel.id_face);
    const quarteiraoId = face ? face.id_quarteirao : '';
    
    setFormData({
      id_quarteirao: quarteiraoId ? quarteiraoId.toString() : '',
      seq1: imovel.seq1 ? imovel.seq1.toString() : '',
      id_face: imovel.id_face ? imovel.id_face.toString() : '',
      nome_logradouro: imovel.nome_logradouro || '',
      numero: imovel.numero || '',
      seq: imovel.seq || '',
      tipo: imovel.tipo || 'R-Residência',
      status: imovel.status || 'Ativo',
    });
    setDropdownAberto(null);
    setModalVisible(true);
  };

  const salvarImovel = async () => {
    if (!formData.id_face || !formData.seq1) {
      Alert.alert('⚠️ Atenção', 'Preencha quarteirão, face e sequência');
      return;
    }

    try {
      if (editando && imovelEditando) {
        await imovelService.update(imovelEditando.id_imovel, {
          id_face: parseInt(formData.id_face),
          seq1: parseInt(formData.seq1),
          nome_logradouro: formData.nome_logradouro,
          numero: formData.numero,
          seq: formData.seq,
          tipo: formData.tipo,
          status: formData.status,
        });
        Alert.alert('✅ Sucesso', 'Imóvel atualizado!');
      } else {
        await imovelService.create({
          id_face: parseInt(formData.id_face),
          seq1: parseInt(formData.seq1),
          nome_logradouro: formData.nome_logradouro,
          numero: formData.numero,
          seq: formData.seq,
          tipo: formData.tipo,
          status: formData.status,
        });
        Alert.alert('✅ Sucesso', 'Imóvel cadastrado!');
      }
      
      await carregarImoveis();
      setModalVisible(false);
    } catch (error: any) {
      if (!error?.response) {
        await addImovelLocal({
          id_face: parseInt(formData.id_face),
          seq1: parseInt(formData.seq1),
          nome_logradouro: formData.nome_logradouro,
          numero: formData.numero,
          seq: formData.seq,
          tipo: formData.tipo,
          status: formData.status,
        });
        await carregarImoveis();
        setModalVisible(false);
        Alert.alert('Salvo offline', 'Imóvel gravado localmente e marcado para sincronização.');
        return;
      }
      Alert.alert('Erro', error.message || 'Não foi possível salvar');
    }
  };

  const excluirImovel = async (id: number) => {
    Alert.alert('⚠️ Confirmar exclusão', 'Tem certeza?', [
      { text: '❌ Cancelar', style: 'cancel' },
      {
        text: '🗑️ Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await imovelService.delete(id);
            await carregarImoveis();
            Alert.alert('✅ Sucesso', 'Imóvel excluído!');
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir');
          }
        },
      },
    ]);
  };

  const renderImovelCard = (imovel: Imovel) => (
    <View key={imovel.id_imovel} style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.numeroContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="business-outline" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.nomeContainer}>
            <Text style={[styles.nomeText, { color: colors.text }]}>Imóvel {imovel.seq1}</Text>
            <Text style={[styles.numeroQuarteiraoText, { color: colors.textSecondary }]} numberOfLines={1}>
              {imovel.nome_logradouro || 'S/N'} · Nº {imovel.numero || 'S/N'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusPill, imovel.status === 'Ativo' ? styles.activePill : styles.inactivePill]}>
          <Text style={[styles.statusPillText, imovel.status === 'Ativo' ? styles.activePillText : styles.inactivePillText]}>{imovel.status}</Text>
        </View>
      </View>

      <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.tableHeaderText, { color: colors.textSecondary }, styles.detailColumn]}>DETALHES</Text>
        <Text style={[styles.tableHeaderText, { color: colors.textSecondary }, styles.actionsColumn]}>AÇÕES</Text>
      </View>

      <View style={styles.imovelRow}>
        <View style={styles.detailColumn}>
          <Text style={[styles.detailValue, { color: colors.text }]}>{imovel.nome_quadra || 'Quarteirão'}</Text>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{imovel.tipo || 'Tipo não informado'}</Text>
        </View>
        <View style={[styles.rowActions, styles.actionsColumn]}>
          <TouchableOpacity style={styles.rowActionButton} onPress={() => abrirModalEdicao(imovel)}>
            <Ionicons name="create-outline" size={16} color="#1769E0" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rowActionButton, styles.rowDeleteButton]} onPress={() => excluirImovel(imovel.id_imovel)}>
            <Ionicons name="trash-outline" size={16} color="#E11D48" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
      
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🏢 Imóveis</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: isDark ? colors.input : '#F5F5F7' }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar..."
            placeholderTextColor={colors.placeholder}
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      </View>

      <View style={[styles.controls, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.controlsLeft}>
          <TouchableOpacity style={[styles.newButton, { backgroundColor: colors.primary }]} onPress={abrirModalCadastro}>
            <Text style={styles.plusIcon}>➕</Text>
            <Text style={styles.newButtonText}>Novo Imóvel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRight}>
          <View style={styles.itemsPerPageContainer}>
            <Text style={styles.itemsPerPageLabel}>Itens por página:</Text>
            <View style={styles.itemsPerPageButtons}>
              {opcoesItensPorPagina.map((quantidade) => (
                <TouchableOpacity
                  key={`items-${quantidade}`}
                  style={[
                    styles.itemsPerPageButton,
                    itensPorPagina === quantidade && styles.itemsPerPageButtonActive
                  ]}
                  onPress={() => {
                    setItensPorPagina(quantidade);
                    setPaginaAtual(1);
                  }}
                >
                  <Text style={[
                    styles.itemsPerPageButtonText,
                    itensPorPagina === quantidade && styles.itemsPerPageButtonTextActive
                  ]}>
                    {quantidade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {loading && imoveis.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>⏳</Text>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando imóveis...</Text>
        </View>
      ) : imoveisFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {busca ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
          </Text>
          {busca ? (
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Não encontramos imóveis com "{busca}"
            </Text>
          ) : (
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Clique em "➕ Novo Imóvel" para adicionar o primeiro
            </Text>
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            {imoveisPagina.map(renderImovelCard)}
          </ScrollView>

          {totalItens > itensPorPagina && (
            <View style={[styles.paginacaoContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.navButton, paginaAtual === 1 && styles.navButtonDisabled]}
                onPress={() => paginaAtual > 1 && setPaginaAtual(paginaAtual - 1)}
                disabled={paginaAtual === 1}
              >
                <Ionicons name="chevron-back" size={18} color={paginaAtual === 1 ? colors.textSecondary : colors.text} />
                <Text style={[styles.navButtonText, { color: colors.text }, paginaAtual === 1 && styles.navButtonTextDisabled]}>Anterior</Text>
              </TouchableOpacity>

              <View style={styles.paginasContainer}>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const inicioPaginas = Math.max(1, paginaAtual - 2);
                  const pagina = inicioPaginas + i;
                  if (pagina > totalPaginas) return null;
                  return (
                    <TouchableOpacity
                      key={pagina}
                      style={[
                        styles.paginaButton,
                        paginaAtual === pagina && styles.paginaButtonActive
                      ]}
                      onPress={() => setPaginaAtual(pagina)}
                    >
                      <Text style={[
                        styles.paginaButtonText,
                        paginaAtual === pagina && styles.paginaButtonTextActive
                      ]}>
                        {pagina}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.navButton, paginaAtual === totalPaginas && styles.navButtonDisabled]}
                onPress={() => paginaAtual < totalPaginas && setPaginaAtual(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
              >
                <Text style={[styles.navButtonText, { color: colors.text }, paginaAtual === totalPaginas && styles.navButtonTextDisabled]}>Próxima</Text>
                <Ionicons name="chevron-forward" size={18} color={paginaAtual === totalPaginas ? colors.textSecondary : colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {imoveisFiltrados.length > 0 && (
        <View style={[styles.paginationInfo, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Text style={[styles.paginationText, { color: colors.textSecondary }]}>
            Mostrando {inicio + 1} - {Math.min(fim, totalItens)} de {totalItens} imóveis
          </Text>
          <Text style={[styles.paginationText, { color: colors.textSecondary }]}>
            Página {paginaAtual} de {totalPaginas}
          </Text>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setDropdownAberto(null); setModalVisible(false); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editando ? 'Editar Imóvel' : 'Cadastrar Imóvel'}</Text>
              <TouchableOpacity onPress={() => { setDropdownAberto(null); setModalVisible(false); }}><Text style={styles.modalClose}>×</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm} contentContainerStyle={styles.modalFormContent} keyboardShouldPersistTaps="handled">
              <View style={styles.formRow}>
                <View style={[styles.formField, styles.fieldWide]}>
                  <Text style={[styles.label, { color: colors.text }]}>Selecione o quarteirão</Text>
                  <DropdownField label={quarteiroes.find((q) => q.id_quadra.toString() === formData.id_quarteirao)?.nome_quadra || 'Selecione'} onPress={() => setDropdownAberto('quarteirao')} />
                </View>
                <View style={[styles.formField, styles.fieldSmall]}>
                  <Text style={[styles.label, { color: colors.text }]}>Sequência</Text>
                  <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]} value={formData.seq1} onChangeText={(text) => setFormData({ ...formData, seq1: text })} keyboardType="numeric" />
                </View>
                <View style={[styles.formField, styles.fieldFace]}>
                  <Text style={[styles.label, { color: colors.text }]}>Face (opcional)</Text>
                  <DropdownField label={facesFiltradas.find((f) => f.id_face.toString() === formData.id_face) ? `Face #${facesFiltradas.find((f) => f.id_face.toString() === formData.id_face).numero_face}` : 'Selecione um quarteirão'} onPress={() => setDropdownAberto('face')} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, styles.fieldLogradouro]}>
                  <Text style={[styles.label, { color: colors.text }]}>Logradouro</Text>
                  <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]} value={formData.nome_logradouro} onChangeText={(text) => setFormData({ ...formData, nome_logradouro: text.toUpperCase() })} autoCapitalize="characters" />
                </View>
                <View style={[styles.formField, styles.fieldSmall]}>
                  <Text style={[styles.label, { color: colors.text }]}>Nº do Imóvel</Text>
                  <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]} value={formData.numero} onChangeText={(text) => setFormData({ ...formData, numero: text })} />
                </View>
                <View style={[styles.formField, styles.fieldSmall]}>
                  <Text style={[styles.label, { color: colors.text }]}>Seq</Text>
                  <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]} value={formData.seq} onChangeText={(text) => setFormData({ ...formData, seq: text })} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, styles.fieldWide]}>
                  <Text style={[styles.label, { color: colors.text }]}>Complemento</Text>
                  <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]} placeholder="Complemento" placeholderTextColor={colors.placeholder} />
                </View>
                <View style={[styles.formField, styles.fieldWide]}>
                  <Text style={[styles.label, { color: colors.text }]}>Tipo de Imóvel</Text>
                  <DropdownField label={formData.tipo} onPress={() => setDropdownAberto('tipo')} />
                </View>
                <View style={[styles.formField, styles.fieldSmall]}>
                  <Text style={[styles.label, { color: colors.text }]}>Status</Text>
                  <DropdownField label={formData.status} onPress={() => setDropdownAberto('status')} />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.label, { color: colors.text }]}>Responsável</Text>
                <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]} placeholder="Responsável" placeholderTextColor={colors.placeholder} />
              </View>

              <TouchableOpacity style={[styles.locationButton, { borderColor: colors.location }]}>
                <Ionicons name="locate-outline" size={18} color={colors.location} />
                <Text style={[styles.locationButtonText, { color: colors.location }]}>Detectar localização atual</Text>
              </TouchableOpacity>
              <QuarteiraoMapWebView key={formData.id_quarteirao || 'sem-quarteirao'} initialPolygon={poligonoSelecionado} initialCenter={centroQuarteirao} interactive={false} height={300} />
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={salvarImovel}>
                <Ionicons name={editando ? 'save-outline' : 'checkmark-circle-outline'} size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>{editando ? 'Atualizar' : 'Cadastrar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={dropdownAberto !== null} transparent animationType="fade" onRequestClose={() => setDropdownAberto(null)}>
        <View style={styles.selectorOverlay}>
          <View style={[styles.selectorContent, { backgroundColor: colors.card }]}>
            <View style={styles.selectorHeader}>
              <Text style={[styles.selectorTitle, { color: colors.text }]}>
                {dropdownAberto === 'quarteirao' ? 'Selecione o quarteirão' : dropdownAberto === 'face' ? 'Selecione a face' : dropdownAberto === 'tipo' ? 'Tipo de imóvel' : 'Status'}
              </Text>
              <TouchableOpacity onPress={() => setDropdownAberto(null)}><Text style={[styles.selectorClose, { color: colors.text }]}>×</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.selectorList} contentContainerStyle={styles.selectorListContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
              {dropdownAberto === 'quarteirao' && quarteiroes.map((q) => <DropdownOption key={q.id_quadra} label={`${q.nome_quadra} - Nº ${q.numero_quadra}`} selected={formData.id_quarteirao === q.id_quadra.toString()} onPress={() => { setFormData({ ...formData, id_quarteirao: q.id_quadra.toString(), id_face: '' }); setDropdownAberto(null); }} />)}
              {dropdownAberto === 'face' && facesFiltradas.map((f) => <DropdownOption key={f.id_face} label={`Face #${f.numero_face}`} selected={formData.id_face === f.id_face.toString()} onPress={() => { setFormData({ ...formData, id_face: f.id_face.toString() }); setDropdownAberto(null); }} />)}
              {dropdownAberto === 'tipo' && TIPOS_IMOVEL.map((tipo) => <DropdownOption key={tipo} label={tipo} selected={formData.tipo === tipo} onPress={() => { setFormData({ ...formData, tipo }); setDropdownAberto(null); }} />)}
              {dropdownAberto === 'status' && (['Ativo', 'Inativo'] as const).map((status) => <DropdownOption key={status} label={status} selected={formData.status === status} onPress={() => { setFormData({ ...formData, status }); setDropdownAberto(null); }} />)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  headerRight: { width: 40 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  controlsLeft: { flex: 1 },
  controlsRight: { alignItems: 'flex-end' },
  newButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  plusIcon: { fontSize: 16, marginRight: 8 },
  newButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  itemsPerPageContainer: { alignItems: 'center' },
  itemsPerPageLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  itemsPerPageButtons: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 6, padding: 2 },
  itemsPerPageButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginHorizontal: 2 },
  itemsPerPageButtonActive: { backgroundColor: '#FFFFFF', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  itemsPerPageButtonText: { fontSize: 12, color: '#666', fontWeight: '600' },
  itemsPerPageButtonTextActive: { color: '#4CAF50' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingIcon: { fontSize: 48, marginBottom: 16 },
  loadingText: { fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, marginTop: 8, fontWeight: '600' },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center', maxWidth: 300 },
  scrollContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  numeroContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  numeroText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  nomeContainer: { flex: 1 },
  nomeText: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  numeroQuarteiraoText: { fontSize: 11, letterSpacing: 0.35, fontWeight: '600' },
  subtitleText: { fontSize: 13 },
  statusContainer: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, minWidth: 40, alignItems: 'center' },
  statusText: { fontSize: 16 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, minWidth: 64 },
  activePill: { backgroundColor: '#DCFCE7' },
  inactivePill: { backgroundColor: '#FEE2E2' },
  activePillText: { color: '#166534' },
  inactivePillText: { color: '#991B1B' },
  statusPillText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, paddingBottom: 8, borderBottomWidth: 1 },
  tableHeaderText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  detailColumn: { flex: 1 },
  actionsColumn: { width: 90 },
  imovelRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10 },
  rowActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  rowActionButton: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF5FF' },
  rowDeleteButton: { backgroundColor: '#FFF1F2' },
  cardDetails: { marginBottom: 12, paddingTop: 12, borderTopWidth: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 13, marginBottom: 2, fontWeight: '600' },
  detailValue: { fontSize: 14 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTopWidth: 1 },
  actionButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1 },
  editButton: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  deleteButton: { borderColor: '#FF5252', backgroundColor: '#FFEBEE' },
  actionButtonText: { fontSize: 13, fontWeight: '600' },
  paginacaoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#F5F5F7' },
  navButtonDisabled: { backgroundColor: '#F0F0F0', opacity: 0.5 },
  navButtonText: { fontSize: 13, color: '#333', fontWeight: '600' },
  navButtonTextDisabled: { color: '#999' },
  paginasContainer: { flexDirection: 'row', alignItems: 'center' },
  paginaButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2, backgroundColor: '#F5F5F7' },
  paginaButtonActive: { backgroundColor: '#4CAF50' },
  paginaButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  paginaButtonTextActive: { color: '#FFFFFF' },
  paginationInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  paginationText: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '94%', overflow: 'visible' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#35B7C9' },
  modalTitle: { fontSize: 21, fontWeight: 'bold', color: '#FFFFFF' },
  modalClose: { color: '#FFFFFF', fontSize: 30, lineHeight: 30, fontWeight: '300' },
  modalForm: { paddingHorizontal: 20, paddingTop: 8 },
  modalFormContent: { paddingBottom: 24 },
  formRow: { flexDirection: 'column', alignItems: 'stretch', marginBottom: 0 },
  formField: { width: '100%', marginBottom: 16, zIndex: 1 },
  fieldWide: { flex: 0, width: '100%' },
  fieldSmall: { flex: 0, width: '100%' },
  fieldFace: { flex: 0, width: '100%' },
  fieldLogradouro: { flex: 0, width: '100%' },
  dropdownWrapper: { position: 'relative', zIndex: 20 },
  dropdownField: { height: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D8DEEC', borderRadius: 7, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownLabel: { color: '#163BFF', fontSize: 16, fontWeight: '700', flex: 1 },
  dropdownArrow: { color: '#163BFF', fontSize: 22, marginLeft: 6 },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF1F5' },
  dropdownOptionText: { fontSize: 14, color: '#334155' },
  dropdownOptionSelected: { color: '#163BFF', fontWeight: '700' },
  selectorOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  selectorContent: { maxHeight: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  selectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#D8DEEC' },
  selectorTitle: { fontSize: 18, fontWeight: '700' },
  selectorClose: { fontSize: 28, lineHeight: 28, paddingHorizontal: 4 },
  selectorList: { flexGrow: 0 },
  selectorListContent: { paddingBottom: 20 },
  locationButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8, gap: 7 },
  locationButtonText: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, minHeight: 48, backgroundColor: '#FAFAFA' },
  pickerContainer: { borderWidth: 1, borderRadius: 8, maxHeight: 150, backgroundColor: '#FAFAFA', borderColor: '#E5E5EA' },
  pickerScroll: { maxHeight: 150 },
  pickerOption: { padding: 12, borderBottomWidth: 1, minHeight: 48, borderBottomColor: '#F0F0F0' },
  pickerOptionSelected: { backgroundColor: '#E8F5E9' },
  pickerOptionText: { fontSize: 16, color: '#333' },
  pickerOptionTextSelected: { color: '#4CAF50', fontWeight: '600' },
  modalFooter: { padding: 20, borderTopWidth: 1 },
  modalButton: { flexDirection: 'row', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default CadastroImovel;
