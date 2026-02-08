// src/screens/CadastroQuarteirao.tsx - COM PAGINAÇÃO E BUSCA
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
  Dimensions,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

const { width } = Dimensions.get('window');

// Tipos de dados
interface Quarteirao {
  id: string;
  numero: number;
  nome: string;
  localidade: string;
  zona: string;
  status: 'Ativo' | 'Inativo';
  area: number;
  data_cadastro: string;
  descricao?: string;
}

const CadastroQuarteirao: React.FC = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [quarteiraoEditando, setQuarteiraoEditando] = useState<Quarteirao | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [opcoesItensPorPagina] = useState([5, 10, 20, 50]);
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    localidade: '',
    zona: '',
    area: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
    descricao: '',
  });

  // Dados mockados (usar até criar tabela)
  const [quarteiroes, setQuarteiroes] = useState<Quarteirao[]>([
    { id: '1', numero: 1, nome: 'Quarteirão Norte A', localidade: 'Fazenda São João', zona: 'Zona Norte', status: 'Ativo', area: 5.2, data_cadastro: '2024-01-15', descricao: 'Quarteirão principal da fazenda' },
    { id: '2', numero: 2, nome: 'Quarteirão Sul B', localidade: 'Fazenda Santa Maria', zona: 'Zona Sul', status: 'Ativo', area: 3.8, data_cadastro: '2024-01-20', descricao: 'Área de pastagem' },
    { id: '3', numero: 3, nome: 'Quarteirão Leste C', localidade: 'Fazenda São João', zona: 'Zona Leste', status: 'Inativo', area: 7.1, data_cadastro: '2024-01-25', descricao: 'Em processo de recuperação' },
    { id: '4', numero: 4, nome: 'Quarteirão Oeste D', localidade: 'Fazenda Nova', zona: 'Zona Oeste', status: 'Ativo', area: 4.5, data_cadastro: '2024-02-01', descricao: 'Área de plantio' },
    { id: '5', numero: 5, nome: 'Quarteirão Centro E', localidade: 'Fazenda São João', zona: 'Zona Central', status: 'Ativo', area: 6.3, data_cadastro: '2024-02-05', descricao: 'Área administrativa' },
    { id: '6', numero: 6, nome: 'Quarteirão Nordeste F', localidade: 'Fazenda Santa Maria', zona: 'Zona Nordeste', status: 'Ativo', area: 8.2, data_cadastro: '2024-02-10', descricao: 'Expansão da fazenda' },
    { id: '7', numero: 7, nome: 'Quarteirão Noroeste G', localidade: 'Fazenda São João', zona: 'Zona Noroeste', status: 'Inativo', area: 2.5, data_cadastro: '2024-02-15', descricao: 'Em reforma' },
    { id: '8', numero: 8, nome: 'Quarteirão Sudeste H', localidade: 'Fazenda Nova', zona: 'Zona Sudeste', status: 'Ativo', area: 9.1, data_cadastro: '2024-02-20', descricao: 'Novo plantio' },
    { id: '9', numero: 9, nome: 'Quarteirão Sudoeste I', localidade: 'Fazenda Santa Maria', zona: 'Zona Sudoeste', status: 'Ativo', area: 3.2, data_cadastro: '2024-02-25', descricao: 'Pastagem natural' },
    { id: '10', numero: 10, nome: 'Quarteirão Central J', localidade: 'Fazenda São João', zona: 'Zona Central', status: 'Ativo', area: 4.8, data_cadastro: '2024-03-01', descricao: 'Próximo à sede' },
    { id: '11', numero: 11, nome: 'Quarteirão Novo K', localidade: 'Fazenda Nova', zona: 'Zona Leste', status: 'Ativo', area: 5.7, data_cadastro: '2024-03-05', descricao: 'Recentemente adquirido' },
    { id: '12', numero: 12, nome: 'Quarteirão Velho L', localidade: 'Fazenda São João', zona: 'Zona Oeste', status: 'Inativo', area: 2.3, data_cadastro: '2024-03-10', descricao: 'Área em descanso' },
    { id: '13', numero: 13, nome: 'Quarteirão Grande M', localidade: 'Fazenda Santa Maria', zona: 'Zona Sul', status: 'Ativo', area: 12.5, data_cadastro: '2024-03-15', descricao: 'Maior quarteirão' },
    { id: '14', numero: 14, nome: 'Quarteirão Pequeno N', localidade: 'Fazenda São João', zona: 'Zona Norte', status: 'Ativo', area: 1.8, data_cadastro: '2024-03-20', descricao: 'Quarteirão experimental' },
    { id: '15', numero: 15, nome: 'Quarteirão Teste O', localidade: 'Fazenda Nova', zona: 'Zona Central', status: 'Inativo', area: 3.4, data_cadastro: '2024-03-25', descricao: 'Em testes' },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [tabelaExiste, setTabelaExiste] = useState(true);

  // Filtra quarteirões por busca
  const quarteiroesFiltrados = quarteiroes.filter(quarteirao =>
    quarteirao.nome.toLowerCase().includes(busca.toLowerCase()) ||
    quarteirao.localidade.toLowerCase().includes(busca.toLowerCase()) ||
    quarteirao.zona.toLowerCase().includes(busca.toLowerCase())
  );

  // Calcula paginação
  const totalItens = quarteiroesFiltrados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  
  // Ajusta página atual se necessário
  useEffect(() => {
    if (paginaAtual > totalPaginas && totalPaginas > 0) {
      setPaginaAtual(totalPaginas);
    }
  }, [totalItens, itensPorPagina]);

  // Pega itens da página atual
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const quarteiroesPagina = quarteiroesFiltrados.slice(inicio, fim);

  // Carregar quarteirões com verificação de tabela
  const carregarQuarteiroes = async () => {
    try {
      setLoading(true);
      
      // Tentar carregar do Supabase
      const { data, error } = await supabase
        .from('quarteiroes')
        .select('*')
        .order('numero', { ascending: true });

      if (error) {
        // Se tabela não existe, usar dados mockados
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          console.log('Tabela não existe ainda, usando dados mockados');
          setTabelaExiste(false);
          // Já temos dados mockados inicializados
        } else {
          console.error('Erro ao carregar quarteirões:', error);
        }
        return;
      }

      // Se chegou aqui, tabela existe
      setTabelaExiste(true);
      setQuarteiroes(data || []);
      
    } catch (error) {
      console.error('Erro geral:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar dados inicial
  useEffect(() => {
    carregarQuarteiroes();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    carregarQuarteiroes();
  };

  // Função para abrir modal de cadastro
  const abrirModalCadastro = () => {
    setEditando(false);
    setQuarteiraoEditando(null);
    setFormData({
      nome: '',
      localidade: '',
      zona: '',
      area: '',
      status: 'Ativo',
      descricao: '',
    });
    setModalVisible(true);
  };

  // Função para abrir modal de edição
  const abrirModalEdicao = (quarteirao: Quarteirao) => {
    setEditando(true);
    setQuarteiraoEditando(quarteirao);
    setFormData({
      nome: quarteirao.nome,
      localidade: quarteirao.localidade,
      zona: quarteirao.zona,
      area: quarteirao.area.toString(),
      status: quarteirao.status,
      descricao: quarteirao.descricao || '',
    });
    setModalVisible(true);
  };

  // Função para salvar quarteirão
  const salvarQuarteirao = async () => {
    if (!formData.nome || !formData.localidade || !formData.zona || !formData.area) {
      Alert.alert('⚠️ Atenção', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (editando && quarteiraoEditando) {
      // Editar quarteirão existente
      const novosQuarteiroes = quarteiroes.map(q => 
        q.id === quarteiraoEditando.id 
          ? { 
              ...q, 
              nome: formData.nome,
              localidade: formData.localidade,
              zona: formData.zona,
              area: parseFloat(formData.area),
              status: formData.status,
              descricao: formData.descricao
            }
          : q
      );
      setQuarteiroes(novosQuarteiroes);
      Alert.alert('✅ Sucesso', 'Quarteirão atualizado com sucesso!');
    } else {
      // Adicionar novo quarteirão
      const novoQuarteirao: Quarteirao = {
        id: Date.now().toString(),
        numero: quarteiroes.length + 1,
        nome: formData.nome,
        localidade: formData.localidade,
        zona: formData.zona,
        area: parseFloat(formData.area),
        status: formData.status,
        descricao: formData.descricao,
        data_cadastro: new Date().toISOString(),
      };
      setQuarteiroes([...quarteiroes, novoQuarteirao]);
      Alert.alert('✅ Sucesso', 'Quarteirão cadastrado com sucesso!');
    }

    setModalVisible(false);
  };

  // Função para excluir quarteirão
  const excluirQuarteirao = (id: string) => {
    Alert.alert(
      '⚠️ Confirmar exclusão',
      'Tem certeza que deseja excluir este quarteirão?',
      [
        { text: '❌ Cancelar', style: 'cancel' },
        {
          text: '🗑️ Excluir',
          style: 'destructive',
          onPress: () => {
            const novosQuarteiroes = quarteiroes.filter(q => q.id !== id);
            setQuarteiroes(novosQuarteiroes);
            Alert.alert('✅ Sucesso', 'Quarteirão excluído com sucesso!');
          },
        },
      ]
    );
  };

  // Funções de paginação
  const irParaPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaAtual(pagina);
    }
  };

  const irParaProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  const irParaPaginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  // Renderizar cada quarteirão
  const renderQuarteiraoItem = (quarteirao: Quarteirao) => (
    <View key={quarteirao.id} style={styles.quarteiraoCard}>
      {/* Cabeçalho do card */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.numeroContainer}>
            <Text style={styles.numeroText}>#{quarteirao.numero}</Text>
          </View>
          <View style={styles.nomeContainer}>
            <Text style={styles.nomeText}>📍 {quarteirao.nome}</Text>
            {quarteirao.descricao && (
              <Text style={styles.descricaoText}>{quarteirao.descricao}</Text>
            )}
          </View>
        </View>
        
        <View style={[
          styles.statusContainer,
          { backgroundColor: quarteirao.status === 'Ativo' ? '#4CAF50' : '#FF9800' }
        ]}>
          <Text style={styles.statusText}>
            {quarteirao.status === 'Ativo' ? '✅ Ativo' : '⏸️ Inativo'}
          </Text>
        </View>
      </View>

      {/* Detalhes do quarteirão */}
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>🏠 Localidade:</Text>
            <Text style={styles.detailValue}>{quarteirao.localidade}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>🧭 Zona:</Text>
            <Text style={styles.detailValue}>{quarteirao.zona}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📏 Área:</Text>
            <Text style={styles.detailValue}>{quarteirao.area} hectares</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📅 Cadastro:</Text>
            <Text style={styles.detailValue}>
              {new Date(quarteirao.data_cadastro).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </View>

      {/* Ações */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => abrirModalEdicao(quarteirao)}
        >
          <Text style={styles.actionButtonText}>✏️ Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => excluirQuarteirao(quarteirao.id)}
        >
          <Text style={styles.actionButtonText}>🗑️ Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar controles de paginação
  const renderPaginacao = () => {
    if (totalItens <= itensPorPagina) return null;

    const paginas = [];
    const maxBotoes = 5;
    let inicioPaginas = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
    let fimPaginas = Math.min(totalPaginas, inicioPaginas + maxBotoes - 1);

    // Ajusta se estiver perto do início/fim
    if (fimPaginas - inicioPaginas + 1 < maxBotoes) {
      inicioPaginas = Math.max(1, fimPaginas - maxBotoes + 1);
    }

    for (let i = inicioPaginas; i <= fimPaginas; i++) {
      paginas.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.paginaButton,
            paginaAtual === i && styles.paginaButtonActive
          ]}
          onPress={() => irParaPagina(i)}
        >
          <Text style={[
            styles.paginaButtonText,
            paginaAtual === i && styles.paginaButtonTextActive
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.paginacaoContainer}>
        <TouchableOpacity
          style={[styles.navButton, paginaAtual === 1 && styles.navButtonDisabled]}
          onPress={irParaPaginaAnterior}
          disabled={paginaAtual === 1}
        >
          <Text style={[
            styles.navButtonText,
            paginaAtual === 1 && styles.navButtonTextDisabled
          ]}>
            ⬅️ Anterior
          </Text>
        </TouchableOpacity>

        <View style={styles.paginasContainer}>
          {paginas}
        </View>

        <TouchableOpacity
          style={[styles.navButton, paginaAtual === totalPaginas && styles.navButtonDisabled]}
          onPress={irParaProximaPagina}
          disabled={paginaAtual === totalPaginas}
        >
          <Text style={[
            styles.navButtonText,
            paginaAtual === totalPaginas && styles.navButtonTextDisabled
          ]}>
            Próxima ➡️
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Conteúdo principal
  const renderContent = () => {
    if (loading && quarteiroes.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>⏳</Text>
          <Text style={styles.loadingText}>Carregando quarteirões...</Text>
        </View>
      );
    }

    if (quarteiroesFiltrados.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>
            {busca ? 'Nenhum quarteirão encontrado' : 'Nenhum quarteirão cadastrado'}
          </Text>
          {busca ? (
            <Text style={styles.emptySubtext}>
              Não encontramos quarteirões com "{busca}"
            </Text>
          ) : (
            <Text style={styles.emptySubtext}>
              Clique em "➕ Novo Quarteirão" para adicionar o primeiro
            </Text>
          )}
        </View>
      );
    }

    return (
      <>
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Aviso se usando dados locais */}
          {!tabelaExiste && (
            <View style={styles.localDataWarning}>
              <Text style={styles.warningIcon}>📱</Text>
              <Text style={styles.warningText}>
                Usando dados locais (tabela não criada ainda)
              </Text>
            </View>
          )}

          {/* Lista de quarteirões */}
          <View style={styles.quarteiroesList}>
            {quarteiroesPagina.map(renderQuarteiraoItem)}
          </View>
        </ScrollView>

        {/* Controles de paginação */}
        {renderPaginacao()}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏗️ Quarteirões Cadastrados</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Barra de busca */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar quarteirão, localidade ou zona..."
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
        <Text style={styles.resultadosText}>
          {busca ? `🔍 ${quarteiroesFiltrados.length} resultado(s) encontrado(s)` : ''}
        </Text>
      </View>

      {/* Controles superiores */}
      <View style={styles.controls}>
        <View style={styles.controlsLeft}>
          <TouchableOpacity 
            style={styles.newButton}
            onPress={abrirModalCadastro}
          >
            <Text style={styles.plusIcon}>➕</Text>
            <Text style={styles.newButtonText}>Novo Quarteirão</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRight}>
          {/* Selecionar itens por página */}
          <View style={styles.itemsPerPageContainer}>
            <Text style={styles.itemsPerPageLabel}>Itens por página:</Text>
            <View style={styles.itemsPerPageButtons}>
              {opcoesItensPorPagina.map((quantidade) => (
                <TouchableOpacity
                  key={quantidade}
                  style={[
                    styles.itemsPerPageButton,
                    itensPorPagina === quantidade && styles.itemsPerPageButtonActive
                  ]}
                  onPress={() => {
                    setItensPorPagina(quantidade);
                    setPaginaAtual(1); // Volta para primeira página
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

      {/* Conteúdo */}
      {renderContent()}

      {/* Informações da paginação */}
      {quarteiroesFiltrados.length > 0 && (
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Mostrando {inicio + 1} - {Math.min(fim, totalItens)} de {totalItens} quarteirões
          </Text>
          <Text style={styles.paginationText}>
            Página {paginaAtual} de {totalPaginas}
          </Text>
        </View>
      )}

      {/* Resumo */}
      {quarteiroesFiltrados.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>{totalItens}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>📏</Text>
            <Text style={styles.summaryLabel}>Área Total:</Text>
            <Text style={styles.summaryValue}>
              {quarteiroesFiltrados.reduce((sum, q) => sum + q.area, 0).toFixed(1)} ha
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>✅</Text>
            <Text style={styles.summaryLabel}>Ativos:</Text>
            <Text style={styles.summaryValue}>
              {quarteiroesFiltrados.filter(q => q.status === 'Ativo').length}
            </Text>
          </View>
        </View>
      )}

      {/* Modal de Cadastro/Edição */}
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
                {editando ? '✏️ Editar Quarteirão' : '➕ Novo Quarteirão'}
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
                <Text style={styles.label}>📍 Nome do Quarteirão *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Quarteirão Norte"
                  value={formData.nome}
                  onChangeText={(text) => setFormData({ ...formData, nome: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>🏠 Localidade *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Fazenda São João"
                  value={formData.localidade}
                  onChangeText={(text) => setFormData({ ...formData, localidade: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>🧭 Zona *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Zona Norte"
                  value={formData.zona}
                  onChangeText={(text) => setFormData({ ...formData, zona: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>📏 Área (hectares) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 5.2"
                  value={formData.area}
                  onChangeText={(text) => setFormData({ ...formData, area: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>📝 Descrição (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva este quarteirão..."
                  value={formData.descricao}
                  onChangeText={(text) => setFormData({ ...formData, descricao: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>📊 Status</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioButton}
                    onPress={() => setFormData({ ...formData, status: 'Ativo' })}
                  >
                    <Text style={styles.radioIcon}>
                      {formData.status === 'Ativo' ? '🔘' : '⚪'}
                    </Text>
                    <Text style={styles.radioLabel}>✅ Ativo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
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
              
              {/* Aviso sobre onde os dados estão sendo salvos */}
              {!tabelaExiste && (
                <View style={styles.dataWarning}>
                  <Text style={styles.warningIcon}>💾</Text>
                  <Text style={styles.warningText}>
                    Dados sendo salvos localmente
                  </Text>
                </View>
              )}
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
                onPress={salvarQuarteirao}
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
  // Busca
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
    marginBottom: 8,
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
  resultadosText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // Controles
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
  controlsLeft: {
    flex: 1,
  },
  controlsRight: {
    alignItems: 'flex-end',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  // Itens por página
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  itemsPerPageButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  itemsPerPageButtonTextActive: {
    color: '#4CAF50',
  },
  // Loading
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
  // Scroll e conteúdo
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  localDataWarning: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Cards de quarteirão
  quarteiroesList: {
    paddingBottom: 16,
  },
  quarteiraoCard: {
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
    backgroundColor: '#2ecc71',
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
  descricaoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
  // Detalhes do card
  cardDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  // Ações do card
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
  // Paginação
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
  // Informações de paginação
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
  // Empty state
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
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
  },
  // Warning
  warningBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    alignItems: 'center',
    maxWidth: 300,
  },
  dataWarning: {
    backgroundColor: '#D4EDDA',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C3E6CB',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  // Summary
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F9F9F9',
  },
  summaryItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  summaryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginRight: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  // Modal Styles
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
});

export default CadastroQuarteirao;