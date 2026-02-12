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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { faceService, quarteiraoService, authService } from '../../services/api';

interface Face {
  id_face: number;
  numero_face: number;
  id_quarteirao: number;
  nome_quadra: string;
  numero_quadra: number;
  status: 'Ativo' | 'Inativo';
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
      console.error('Erro ao carregar faces:', error);
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
        });
        Alert.alert('✅ Sucesso', 'Face atualizada com sucesso!');
      } else {
        await faceService.create({
          numero_face: parseInt(formData.numero_face),
          id_quarteirao: parseInt(formData.id_quarteirao),
          nome_linha: formData.nome_linha,
          status: formData.status,
        });
        Alert.alert('✅ Sucesso', 'Face cadastrada com sucesso!');
      }
      
      await carregarFaces();
      setModalVisible(false);
    } catch (error: any) {
      console.error('Erro ao salvar face:', error);
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

  const renderFaceItem = (face: Face) => {
    return (
      <View style={styles.card} key={face.id_face}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.numeroContainer}>
              <Text style={styles.numeroText}>#{face.numero_face}</Text>
            </View>
            <View style={styles.nomeContainer}>
              <Text style={styles.nomeText}>📍 {face.nome_quadra || 'Quarteirão'}</Text>
              <Text style={styles.numeroQuarteiraoText}>Nº {face.numero_quadra}</Text>
            </View>
          </View>
          
          <View style={[
            styles.statusContainer,
            { backgroundColor: face.status === 'Ativo' ? '#4CAF50' : '#FF9800' }
          ]}>
            <Text style={styles.statusText}>
              {face.status === 'Ativo' ? '✅ Ativo' : '⏸️ Inativo'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => abrirModalEdicao(face)}
          >
            <Text style={styles.actionButtonText}>✏️ Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => excluirFace(face.id_face)}
          >
            <Text style={styles.actionButtonText}>🗑️ Excluir</Text>
          </TouchableOpacity>
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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏠 Faces Cadastradas</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar face ou quarteirão..."
            value={busca}
            onChangeText={setBusca}
            clearButtonMode="while-editing"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.newButton}
          onPress={abrirModalCadastro}
        >
          <Text style={styles.plusIcon}>➕</Text>
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
          <Text style={styles.loadingIcon}>⏳</Text>
          <Text style={styles.loadingText}>Carregando faces...</Text>
        </View>
      ) : facesFiltradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
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
              {facesPagina.map(renderFaceItem)}
            </View>
          </ScrollView>

          {totalItens > itensPorPagina && (
            <View style={styles.paginacaoContainer}>
              <TouchableOpacity
                style={[styles.navButton, paginaAtual === 1 && styles.navButtonDisabled]}
                onPress={() => setPaginaAtual(paginaAtual - 1)}
                disabled={paginaAtual === 1}
              >
                <Text style={[styles.navButtonText, paginaAtual === 1 && styles.navButtonTextDisabled]}>
                  ⬅️ Anterior
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
                  Próxima ➡️
                </Text>
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
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editando ? '✏️ Editar Face' : '➕ Nova Face'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>🔢 Número da Face *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 1"
                  value={formData.numero_face}
                  onChangeText={(text) => setFormData({ ...formData, numero_face: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>📍 Quarteirão *</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                    {quarteiroes.map((q) => (
                      <TouchableOpacity
                        key={q.id_quadra}
                        style={[
                          styles.pickerOption,
                          formData.id_quarteirao === q.id_quadra.toString() && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, id_quarteirao: q.id_quadra.toString() })}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          formData.id_quarteirao === q.id_quadra.toString() && styles.pickerOptionTextSelected
                        ]}>
                          {formData.id_quarteirao === q.id_quadra.toString() ? '✓ ' : ''}
                          {q.nome_quadra} - Nº {q.numero_quadra}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>📍 Nome da Linha/Polígono da Face</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Face norte, lado ímpar, quadra inteira"
                  value={formData.nome_linha}
                  onChangeText={(text) => setFormData({ ...formData, nome_linha: text.toUpperCase() })}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>📊 Status</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    key="ativo"
                    style={styles.radioButton}
                    onPress={() => setFormData({ ...formData, status: 'Ativo' })}
                  >
                    <Text style={styles.radioIcon}>
                      {formData.status === 'Ativo' ? '🔘' : '⚪'}
                    </Text>
                    <Text style={styles.radioLabel}>✅ Ativo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    key="inativo"
                    style={styles.radioButton}
                    onPress={() => setFormData({ ...formData, status: 'Inativo' })}
                  >
                    <Text style={styles.radioIcon}>
                      {formData.status === 'Inativo' ? '🔘' : '⚪'}
                    </Text>
                    <Text style={styles.radioLabel}>⏸️ Inativo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={salvarFace}
              >
                <Text style={styles.saveButtonText}>
                  {editando ? '💾 Atualizar' : '✅ Cadastrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
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
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 18,
    color: '#666',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  plusIcon: {
    fontSize: 16,
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
    backgroundColor: '#F0F0F0',
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
    color: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  facesList: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  numeroContainer: {
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  numeroQuarteiraoText: {
    fontSize: 13,
    color: '#666',
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    minWidth: 70,
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
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  deleteButton: {
    borderColor: '#FF5252',
    backgroundColor: '#FFEBEE',
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#E8F5E9',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  pickerOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
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
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#4CAF50',
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
