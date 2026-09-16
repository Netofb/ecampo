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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { faceService, quarteiraoService, authService } from '../../services/api';
import { addFaceLocal, listFacesLocais } from '../../services/faceLocal';
import FacesMapWebView from '../../components/FacesMapWebView';
import FaceLineMapEditor, { FaceLineMapData } from '../../components/FaceLineMapEditor';

interface Face {
  id_face: number;
  numero_face: number;
  id_quarteirao: number;
  nome_quadra: string;
  numero_quadra: number;
  status: 'Ativo' | 'Inativo';
  linha_geojson?: object | string | null;
  cor_linha?: string;
  latitude?: string | number;
  longitude?: string | number;
}

const CadastroFace: React.FC = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [faceEditando, setFaceEditando] = useState<Face | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [opcoesItensPorPagina] = useState([5, 10, 20, 50]);
  
  const [formData, setFormData] = useState({
    numero_face: '',
    id_quarteirao: '',
    nome_linha: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

  const [faces, setFaces] = useState<Face[]>([]);
  const [quarteiroes, setQuarteiroes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [faceMapData, setFaceMapData] = useState<FaceLineMapData | null>(null);
  const [faceColor] = useState('#1565C0');
  const [seletorAberto, setSeletorAberto] = useState<'status' | 'quarteirao' | null>(null);

  const facesFiltradas = faces.filter(face =>
    face.numero_face.toString().includes(busca) ||
    (face.nome_quadra || '').toLowerCase().includes(busca.toLowerCase())
  ).sort((a, b) => a.numero_face - b.numero_face);

  const totalItens = facesFiltradas.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  
  useEffect(() => {
    if (paginaAtual > totalPaginas && totalPaginas > 0) {
      setPaginaAtual(totalPaginas);
    }
  }, [totalItens, itensPorPagina]);

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const facesPagina = facesFiltradas.slice(inicio, fim);

  const carregarFaces = async () => {
    try {
      setLoading(true);
      const data = await faceService.list();
      setFaces(data);
      setPaginaAtual(1);
    } catch (error) {
      const locais = await listFacesLocais();
      setFaces(locais.map((face, index) => ({
        ...face,
        id_face: -(index + 1),
        nome_quadra: 'Quarteirão local',
        numero_quadra: 0,
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
      // Silently fail
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        authService.setToken(token);
      }
      carregarFaces();
      carregarQuarteiroes();
    };
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    carregarFaces();
  };

  const abrirModalCadastro = () => {
    setEditando(false);
    setFaceEditando(null);
    setFormData({
      numero_face: '',
      id_quarteirao: quarteiroes.length > 0 ? quarteiroes[0].id_quadra.toString() : '',
      nome_linha: '',
      status: 'Ativo',
    });
    setFaceMapData(null);
    setSeletorAberto(null);
    setModalVisible(true);
  };

  const abrirModalEdicao = (face: Face) => {
    setEditando(true);
    setFaceEditando(face);
    setFormData({
      numero_face: face.numero_face.toString(),
      id_quarteirao: face.id_quarteirao.toString(),
      nome_linha: (face as any).nome_linha || '',
      status: face.status,
    });
    const linhaExistente = typeof face.linha_geojson === 'string' ? (() => {
      try { return JSON.parse(face.linha_geojson); } catch { return null; }
    })() : face.linha_geojson;
    setFaceMapData(linhaExistente ? { geojson: linhaExistente, centroid: { lat: Number(face.latitude), lng: Number(face.longitude) } } : null);
    setSeletorAberto(null);
    setModalVisible(true);
  };

  const salvarFace = async () => {
    if (!formData.numero_face || !formData.id_quarteirao) {
      Alert.alert('⚠️ Atenção', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editando && faceEditando) {
        await faceService.update(faceEditando.id_face, {
          numero_face: parseInt(formData.numero_face),
          id_quarteirao: parseInt(formData.id_quarteirao),
          nome_linha: formData.nome_linha,
          status: formData.status,
          linha_geojson: faceMapData?.geojson,
          cor_linha: faceColor,
          latitude: faceMapData?.centroid.lat,
          longitude: faceMapData?.centroid.lng,
        });
        Alert.alert('✅ Sucesso', 'Face atualizada com sucesso!');
      } else {
        await faceService.create({
          numero_face: parseInt(formData.numero_face),
          id_quarteirao: parseInt(formData.id_quarteirao),
          nome_linha: formData.nome_linha,
          status: formData.status,
          linha_geojson: faceMapData?.geojson,
          cor_linha: faceColor,
          latitude: faceMapData?.centroid.lat,
          longitude: faceMapData?.centroid.lng,
        });
        Alert.alert('✅ Sucesso', 'Face cadastrada com sucesso!');
      }
      
      await carregarFaces();
      setMapRefreshKey((value) => value + 1);
      setModalVisible(false);
    } catch (error: any) {
      if (!error?.response) {
        await addFaceLocal({
          numero_face: parseInt(formData.numero_face),
          id_quarteirao: parseInt(formData.id_quarteirao),
          nome_linha: formData.nome_linha,
          status: formData.status,
          linha_geojson: faceMapData?.geojson,
          cor_linha: faceColor,
          latitude: faceMapData?.centroid.lat,
          longitude: faceMapData?.centroid.lng,
        });
        await carregarFaces();
        setMapRefreshKey((value) => value + 1);
        setModalVisible(false);
        Alert.alert('Salvo offline', 'Face gravada localmente e marcada para sincronização.');
        return;
      }
      Alert.alert('Erro', error.message || 'Não foi possível salvar a face');
    }
  };

  const excluirFace = async (id: number) => {
    Alert.alert(
      '⚠️ Confirmar exclusão',
      'Tem certeza que deseja excluir esta face?',
      [
        { text: '❌ Cancelar', style: 'cancel' },
        {
          text: '🗑️ Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await faceService.delete(id);
              await carregarFaces();
              Alert.alert('✅ Sucesso', 'Face excluída com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a face');
            }
          },
        },
      ]
    );
  };

  const renderFaceCard = (face: Face) => {
    return (
      <View style={styles.card} key={face.id_face}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.numeroContainer}>
              <Ionicons name="git-branch-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.nomeContainer}>
              <Text style={styles.nomeText}>Face {face.numero_face}</Text>
              <Text style={styles.numeroQuarteiraoText}>{face.nome_quadra || 'Quarteirão'} · QUARTEIRÃO {face.numero_quadra || '-'}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, face.status === 'Ativo' ? styles.activePill : styles.inactivePill]}>
            <Text style={[styles.statusPillText, face.status === 'Ativo' ? styles.activePillText : styles.inactivePillText]}>
              {face.status}
            </Text>
          </View>
        </View>

        <FacesMapWebView refreshKey={mapRefreshKey} faceId={face.id_face} />

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.nameColumn]}>NOME DA LINHA</Text>
          <Text style={[styles.tableHeaderText, styles.actionsColumn]}>AÇÕES</Text>
        </View>

        <View style={styles.faceRow}>
          <View style={[styles.faceColumn, styles.faceNumberCell]}>
            <View style={styles.faceLine} />
            <Text style={styles.faceNumberText}>{(face as any).nome_linha || 'Linha da face'}</Text>
          </View>
          <View style={[styles.rowActions, styles.actionsColumn]}>
            <TouchableOpacity style={styles.rowActionButton} onPress={() => abrirModalEdicao(face)}>
              <Ionicons name="create-outline" size={16} color="#1769E0" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rowActionButton, styles.rowDeleteButton]} onPress={() => excluirFace(face.id_face)}>
              <Ionicons name="trash-outline" size={16} color="#E11D48" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Faces Cadastradas</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar face ou quarteirão..."
            value={busca}
            onChangeText={setBusca}
            clearButtonMode="while-editing"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.clearButton}>
              <Ionicons name="close" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.newButton}
          onPress={abrirModalCadastro}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" style={styles.plusIcon} />
          <Text style={styles.newButtonText}>Nova Face</Text>
        </TouchableOpacity>

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

      {loading && faces.length === 0 ? (
        <View style={styles.loadingContainer}>
          <MaterialIcons name="hourglass-empty" size={48} color="#666" />
          <Text style={styles.loadingText}>Carregando faces...</Text>
        </View>
      ) : facesFiltradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {busca ? 'Nenhuma face encontrada' : 'Nenhuma face cadastrada'}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView 
            style={styles.scrollContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.facesList}>
              {facesPagina.map(renderFaceCard)}
            </View>
          </ScrollView>

          {totalItens > itensPorPagina && (
            <View style={styles.paginacaoContainer}>
              <TouchableOpacity
                style={[styles.navButton, paginaAtual === 1 && styles.navButtonDisabled]}
                onPress={() => setPaginaAtual(paginaAtual - 1)}
                disabled={paginaAtual === 1}
              >
                <Ionicons name="chevron-back" size={16} color={paginaAtual === 1 ? '#999' : '#333'} />
                <Text style={[styles.navButtonText, paginaAtual === 1 && styles.navButtonTextDisabled]}>
                  Anterior
                </Text>
              </TouchableOpacity>

              <View style={styles.paginasContainer}>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const pagina = Math.max(1, Math.min(paginaAtual - 2, totalPaginas - 4)) + i;
                  if (pagina > totalPaginas) return null;
                  return (
                    <TouchableOpacity
                      key={pagina}
                      style={[styles.paginaButton, paginaAtual === pagina && styles.paginaButtonActive]}
                      onPress={() => setPaginaAtual(pagina)}
                    >
                      <Text style={[styles.paginaButtonText, paginaAtual === pagina && styles.paginaButtonTextActive]}>
                        {pagina}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.navButton, paginaAtual === totalPaginas && styles.navButtonDisabled]}
                onPress={() => setPaginaAtual(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
              >
                <Text style={[styles.navButtonText, paginaAtual === totalPaginas && styles.navButtonTextDisabled]}>
                  Próxima
                </Text>
                <Ionicons name="chevron-forward" size={16} color={paginaAtual === totalPaginas ? '#999' : '#333'} />
              </TouchableOpacity>
            </View>
          )}

          {totalItens > 0 && (
            <View style={styles.paginationInfo}>
              <Text style={styles.paginationText}>
                Mostrando {inicio + 1} - {Math.min(fim, totalItens)} de {totalItens} faces
              </Text>
              <Text style={styles.paginationText}>
                Página {paginaAtual} de {totalPaginas}
              </Text>
            </View>
          )}
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => { setSeletorAberto(null); setModalVisible(false); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editando ? 'Editar Face' : 'Nova Face'}
              </Text>
              <TouchableOpacity 
                onPress={() => { setSeletorAberto(null); setModalVisible(false); }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} contentContainerStyle={styles.modalFormContent} keyboardShouldPersistTaps="handled">
              <View style={[styles.formColumns, editando && styles.formColumnsVertical]}>
              <View style={[styles.inputGroup, styles.columnSmall]}>
                <Text style={styles.label}>Número da Face *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 1"
                  value={formData.numero_face}
                  onChangeText={(text) => setFormData({ ...formData, numero_face: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.columnSmall]}>
                <Text style={styles.label}>Status</Text>
                <TouchableOpacity style={styles.selectField} onPress={() => setSeletorAberto('status')}>
                  <Text style={styles.selectText}>{formData.status}</Text><Ionicons name="chevron-down" size={18} color="#163BFF" />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, styles.columnMedium]}>
                <Text style={styles.label}>Selecione o quarteirão *</Text>
                <TouchableOpacity style={styles.selectField} onPress={() => setSeletorAberto('quarteirao')}>
                  <Text style={styles.selectText} numberOfLines={1}>{quarteiroes.find((q) => q.id_quadra.toString() === formData.id_quarteirao)?.nome_quadra || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color="#163BFF" />
                </TouchableOpacity>
              </View>
              </View>

              <View style={[styles.formColumns, editando && styles.formColumnsVertical]}>
              <View style={[styles.inputGroup, styles.columnWide]}>
                <Text style={styles.label}>Nome da linha/polígono da face</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Face norte, lado ímpar, quadra inteira"
                  value={formData.nome_linha}
                  onChangeText={(text) => setFormData({ ...formData, nome_linha: text.toUpperCase() })}
                  autoCapitalize="characters"
                />
              </View>

              <View style={[styles.inputGroup, styles.colorGroup]}>
                <Text style={styles.label}>Cor da linha/polígono</Text>
                <View style={[styles.colorSwatch, { backgroundColor: faceColor }]} />
              </View>
              </View>

              <View style={styles.helpBox}><Text style={styles.helpTitle}>ⓘ Selecione o quarteirão e escolha uma ou mais arestas:</Text><Text style={styles.helpText}>• As arestas disponíveis aparecem sobre o quarteirão selecionado.{`\n`}• Desenhe a linha da face no mapa abaixo.{`\n`}• A linha escolhida será gravada como a geometria da face.</Text></View>
              <FaceLineMapEditor
                height={220}
                center={(() => { const q = quarteiroes.find((item) => item.id_quadra.toString() === formData.id_quarteirao); return { lat: Number(q?.latitude_quadra) || -8.3797, lng: Number(q?.longitude_quadra) || -35.4508 }; })()}
                initialLine={faceMapData?.geojson || null}
                color={faceColor}
                onLineChanged={setFaceMapData}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setSeletorAberto(null); setModalVisible(false); }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={salvarFace}
              >
                <Text style={styles.saveButtonText}>
                  {editando ? 'Atualizar' : 'Cadastrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={seletorAberto !== null} transparent animationType="fade" onRequestClose={() => setSeletorAberto(null)}>
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>{seletorAberto === 'quarteirao' ? 'Selecione o quarteirão' : 'Selecione o status'}</Text>
              <TouchableOpacity onPress={() => setSeletorAberto(null)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#55718F" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectorList} contentContainerStyle={styles.selectorListContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
              {seletorAberto === 'status' && (['Ativo', 'Inativo'] as const).map((status) => <TouchableOpacity key={status} style={styles.dropdownOption} onPress={() => { setFormData({ ...formData, status }); setSeletorAberto(null); }}>
                <Text style={[styles.dropdownOptionText, formData.status === status && styles.dropdownOptionTextSelected]}>{formData.status === status ? '✓ ' : ''}{status}</Text>
              </TouchableOpacity>)}
              {seletorAberto === 'quarteirao' && quarteiroes.map((q) => <TouchableOpacity key={q.id_quadra} style={styles.dropdownOption} onPress={() => { setFormData({ ...formData, id_quarteirao: q.id_quadra.toString() }); setSeletorAberto(null); }}>
                <Text style={[styles.dropdownOptionText, formData.id_quarteirao === q.id_quadra.toString() && styles.dropdownOptionTextSelected]}>{formData.id_quarteirao === q.id_quadra.toString() ? '✓ ' : ''}{q.nome_quadra} - Nº {q.numero_quadra}</Text>
              </TouchableOpacity>)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16324F',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E1E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#333',
  },
  clearButton: {
    padding: 6,
  },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F80ED',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 9,
    elevation: 2,
  },
  plusIcon: {
    marginRight: 8,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  itemsPerPageContainer: {
    alignItems: 'center',
  },
  itemsPerPageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemsPerPageButtons: {
    flexDirection: 'row',
    backgroundColor: '#EEF3F8',
    borderRadius: 6,
    padding: 2,
  },
  itemsPerPageButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  itemsPerPageButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  itemsPerPageButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  itemsPerPageButtonTextActive: {
    color: '#2F80ED',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  facesList: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#E4EBF3',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  faceCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  faceCountText: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '700',
  },
  numeroContainer: {
    backgroundColor: '#2F80ED',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numeroText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nomeContainer: {
    flex: 1,
  },
  nomeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17324D',
    marginBottom: 2,
  },
  numeroQuarteiraoText: {
    fontSize: 11,
    letterSpacing: 0.35,
    color: '#6B86A3',
    fontWeight: '600',
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    minWidth: 64,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EDF4',
  },
  tableHeaderText: {
    color: '#55708D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  faceColumn: {
    width: '31%',
  },
  nameColumn: {
    width: '21%',
  },
  statusColumn: {
    width: '22%',
  },
  actionsColumn: {
    width: '26%',
    alignItems: 'flex-end',
  },
  faceRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EDF4',
  },
  faceNumberCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faceLine: {
    width: 24,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#3987F6',
    marginRight: 9,
  },
  faceNumberText: {
    color: '#27496B',
    fontSize: 12,
    fontWeight: '600',
  },
  faceNameText: {
    color: '#64748B',
    fontSize: 12,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activePill: {
    backgroundColor: '#E8F9EF',
  },
  inactivePill: {
    backgroundColor: '#FFF1E5',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activePillText: {
    color: '#159447',
  },
  inactivePillText: {
    color: '#C46A13',
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  rowActionButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#BFD3EC',
    backgroundColor: '#FFFFFF',
  },
  rowDeleteButton: {
    borderColor: '#F2C4CF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#B8D5F8',
    backgroundColor: '#F1F7FF',
  },
  deleteButton: {
    borderColor: '#FF5252',
    backgroundColor: '#FFF5F5',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '94%',
    flexShrink: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
    backgroundColor: '#35B7C9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },

  modalForm: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  modalFormContent: {
    paddingBottom: 8,
  },
  formColumns: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  formColumnsVertical: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
  },
  columnSmall: { flex: 1, zIndex: 20 },
  columnMedium: { flex: 1.2, zIndex: 10 },
  columnWide: { flex: 2.5 },
  colorGroup: { flex: 1 },
  selectField: {
    height: 46,
    borderWidth: 1,
    borderColor: '#DCE6F0',
    borderRadius: 8,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  selectText: { color: '#163BFF', fontSize: 16, fontWeight: '700' },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  dropdownOptionText: { fontSize: 14, color: '#334155' },
  dropdownOptionTextSelected: { color: '#163BFF', fontWeight: '700' },
  selectorOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' },
  selectorContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', overflow: 'hidden' },
  selectorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#DCE6F0' },
  selectorTitle: { fontSize: 18, fontWeight: '700', color: '#17324D' },
  selectorList: { flexGrow: 0 },
  selectorListContent: { paddingBottom: 20 },
  colorSwatch: { width: 68, height: 46, borderWidth: 2, borderColor: '#D5D5D5' },
  helpBox: {
    backgroundColor: '#E8F7FF',
    borderLeftWidth: 4,
    borderLeftColor: '#2DB7C9',
    borderRadius: 7,
    padding: 12,
    marginBottom: 12,
  },
  helpTitle: { color: '#17627A', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  helpText: { color: '#246B80', fontSize: 12, lineHeight: 19 },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCE6F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8FAFD',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DCE6F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFD',
    maxHeight: 150,
  },
  pickerScroll: {
    maxHeight: 150,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerOptionSelected: {
    backgroundColor: '#EAF3FF',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  pickerOptionTextSelected: {
    color: '#2F80ED',
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F7',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#2F80ED',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paginacaoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F7',
  },
  navButtonDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  paginasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    backgroundColor: '#F5F5F7',
  },
  paginaButtonActive: {
    backgroundColor: '#2F80ED',
  },
  paginaButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  paginaButtonTextActive: {
    color: '#FFFFFF',
  },
  paginationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  paginationText: {
    fontSize: 12,
    color: '#666',
  },
});

export default CadastroFace;
