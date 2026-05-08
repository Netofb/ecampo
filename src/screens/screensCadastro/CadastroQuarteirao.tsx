// src/screens/CadastroQuarteirao.tsx - COM PAGINAÇÃO, BUSCA E MAPA
import React, { useState, useEffect, useRef } from 'react';
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { quarteiraoService, localidadeService, zonaService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import QuarteiraoMapWebView, { MapPolygonData, QuarteiraoMapHandle } from '../../components/QuarteiraoMapWebView';

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
  total_producoes?: number;
}

const CadastroQuarteirao: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
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
    numero: '',
    nome: '',
    localidade: '',
    zona: '',
    area: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
    descricao: '',
  });

  const [quarteiroes, setQuarteiroes] = useState<Quarteirao[]>([]);
  const [localidades, setLocalidades] = useState<any[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [tabelaExiste, setTabelaExiste] = useState(true);

  // Mapa
  const mapRef = useRef<QuarteiraoMapHandle>(null);
  const modalScrollRef = useRef<ScrollView>(null);
  const [mapData, setMapData] = useState<MapPolygonData | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Filtra quarteirões por busca
  const quarteiroesFiltrados = quarteiroes.filter(quarteirao =>
    (quarteirao.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (quarteirao.localidade || '').toLowerCase().includes(busca.toLowerCase()) ||
    (quarteirao.zona || '').toLowerCase().includes(busca.toLowerCase())
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

  // Carregar quarteirões usando a nova API
  const carregarQuarteiroes = async () => {
    try {
      setLoading(true);
      const data = await quarteiraoService.list();
      
      const quarteiroesMapeados = data.map((q: any) => ({
        id: q.id_quadra?.toString() || q.id?.toString(),
        numero: q.numero_quadra || q.numero,
        nome: q.nome_quadra || q.nome || 'Sem nome',
        localidade: q.nome_localidade || 'N/A',
        zona: q.nome_zona || 'N/A',
        status: q.status || 'Ativo',
        area: 0,
        data_cadastro: new Date().toISOString(),
        descricao: '',
        total_producoes: parseInt(q.total_producoes) || 0,
      }));
      
      setQuarteiroes(quarteiroesMapeados);
      setTabelaExiste(true);
      setPaginaAtual(1);
      
    } catch (error: any) {
      setQuarteiroes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar localidades e zonas
  const carregarLocalidadesEZonas = async () => {
    try {
      const [localidadesData, zonasData] = await Promise.all([
        localidadeService.list(),
        zonaService.list()
      ]);
      setLocalidades(localidadesData);
      setZonas(zonasData);
    } catch (error) {
      // Silently fail
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

  // Detectar localização e enviar para o mapa
  const detectarLocalizacao = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Habilite a localização nas configurações do dispositivo.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    mapRef.current?.setCenter(loc.coords.latitude, loc.coords.longitude, 17);
  };

  // Função para abrir modal de cadastro
  const abrirModalCadastro = async () => {
    setEditando(false);
    setQuarteiraoEditando(null);
    setMapData(null);
    setMapReady(false);
    
    // Carrega localidades e zonas apenas quando abrir o modal
    if (localidades.length === 0 || zonas.length === 0) {
      await carregarLocalidadesEZonas();
    }
    
    setFormData({
      numero: '',
      nome: '',
      localidade: localidades.length > 0 ? localidades[0].nome_localidade : '',
      zona: zonas.length > 0 ? zonas[0].nome_zona : '',
      area: '',
      status: 'Ativo',
      descricao: '',
    });
    setModalVisible(true);
  };

  // Função para abrir modal de edição
  const abrirModalEdicao = async (quarteirao: Quarteirao) => {
    setEditando(true);
    setQuarteiraoEditando(quarteirao);
    setMapReady(false);
    // Restaura geojson salvo se existir
    const savedGeojson = (quarteirao as any).geojson || null;
    setMapData(savedGeojson ? { geojson: savedGeojson, centroid: { lat: 0, lng: 0 }, bounds: [[0,0],[0,0]], area_m2: 0 } : null);
    
    // Carrega localidades e zonas apenas quando abrir o modal
    if (localidades.length === 0 || zonas.length === 0) {
      await carregarLocalidadesEZonas();
    }
    
    setFormData({
      numero: quarteirao.numero.toString(),
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
    if (!formData.numero || !formData.nome || !formData.localidade || !formData.zona) {
      Alert.alert('⚠️ Atenção', 'Preencha todos os campos obrigatórios (número, nome, localidade e zona)');
      return;
    }

    if (!mapData) {
      Alert.alert(
        '⚠️ Polígono não desenhado',
        'Desenhe o polígono do quarteirão no mapa antes de salvar.',
        [{ text: 'OK' }]
      );
      return;
    }

    const geoPayload = {
      geojson: mapData.geojson,
      centroid_lat: mapData.centroid.lat,
      centroid_lng: mapData.centroid.lng,
      area_m2: mapData.area_m2,
    };

    try {
      if (editando && quarteiraoEditando) {
        // Editar quarteirão existente
        await quarteiraoService.update(parseInt(quarteiraoEditando.id), {
          nome: formData.nome,
          numero: parseInt(formData.numero),
          localidade_nome: formData.localidade,
          zona_nome: formData.zona,
          status: formData.status,
          ...geoPayload,
        });
        Alert.alert('✅ Sucesso', 'Quarteirão atualizado com sucesso!');
      } else {
        // Adicionar novo quarteirão
        await quarteiraoService.create({
          nome: formData.nome,
          numero: parseInt(formData.numero),
          localidade_nome: formData.localidade,
          zona_nome: formData.zona,
          status: formData.status,
          ...geoPayload,
        });
        Alert.alert('✅ Sucesso', 'Quarteirão cadastrado com sucesso!');
      }
      
      // Recarregar lista
      await carregarQuarteiroes();
      setModalVisible(false);
    } catch (error: any) {
      const mensagem = error.response?.data?.error || 'Não foi possível salvar o quarteirão. Verifique se a localidade e zona existem.';
      Alert.alert('Erro', mensagem);
    }
  };

  // Função para excluir quarteirão
  const excluirQuarteirao = async (id: string) => {
    Alert.alert(
      '⚠️ Confirmar exclusão',
      'Tem certeza que deseja excluir este quarteirão?',
      [
        { text: '❌ Cancelar', style: 'cancel' },
        {
          text: '🗑️ Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await quarteiraoService.delete(parseInt(id));
              const novosQuarteiroes = quarteiroes.filter(q => q.id !== id);
              setQuarteiroes(novosQuarteiroes);
              Alert.alert('✅ Sucesso', 'Quarteirão excluído com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o quarteirão');
            }
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
  const renderQuarteiraoItem = (quarteirao: Quarteirao) => {
    return (
      <View style={styles.quarteiraoCard}>
        {/* Cabeçalho do card */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.numeroContainer}>
              <Text style={styles.numeroText}>#{quarteirao.numero}</Text>
            </View>
            <View style={styles.nomeContainer}>
              <Text style={styles.nomeText}>{quarteirao.nome}</Text>
            </View>
          </View>
          
          <View style={[
            styles.statusContainer,
            { backgroundColor: quarteirao.status === 'Ativo' ? '#4CAF50' : '#FF9800' }
          ]}>
            <Text style={styles.statusText}>
              {quarteirao.status === 'Ativo' ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        {/* Detalhes do quarteirão */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Localidade:</Text>
              <Text style={styles.detailValue}>{quarteirao.localidade}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Zona:</Text>
              <Text style={styles.detailValue}>{quarteirao.zona}</Text>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => abrirModalEdicao(quarteirao)}
          >
            <Ionicons name="create-outline" size={16} color="#2196F3" />
            <Text style={[styles.actionButtonText, {color: '#2196F3', marginLeft: 4}]}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => excluirQuarteirao(quarteirao.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF5252" />
            <Text style={[styles.actionButtonText, {color: '#FF5252', marginLeft: 4}]}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          <Ionicons name="chevron-back" size={16} color={paginaAtual === 1 ? '#999' : '#333'} />
          <Text style={[
            styles.navButtonText,
            paginaAtual === 1 && styles.navButtonTextDisabled
          ]}>
            Anterior
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
            Próxima
          </Text>
          <Ionicons name="chevron-forward" size={16} color={paginaAtual === totalPaginas ? '#999' : '#333'} />
        </TouchableOpacity>
      </View>
    );
  };

  // Conteúdo principal
  const renderContent = () => {
    if (loading && quarteiroes.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <MaterialIcons name="hourglass-empty" size={48} color="#666" />
          <Text style={styles.loadingText}>Carregando quarteirões...</Text>
        </View>
      );
    }

    if (quarteiroesFiltrados.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {busca ? 'Nenhum quarteirão encontrado' : 'Nenhum quarteirão cadastrado'}
          </Text>
          {busca ? (
            <Text style={styles.emptySubtext}>
              Não encontramos quarteirões com "{busca}"
            </Text>
          ) : (
            <Text style={styles.emptySubtext}>
              Clique em "Novo Quarteirão" para adicionar o primeiro
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Lista de quarteirões */}
          <View style={styles.quarteiroesList}>
            {quarteiroesPagina.map((q) => (
              <View key={`quarteirao-${q.id}`}>
                {renderQuarteiraoItem(q)}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Controles de paginação */}
        {renderPaginacao()}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quarteirões Cadastrados</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Barra de busca */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar quarteirão, localidade ou zona..."
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
            <Ionicons name="add" size={20} color="#FFFFFF" style={styles.plusIcon} />
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
                  key={`items-${quantidade}`}
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
            <Ionicons name="stats-chart" size={16} color="#666" style={styles.summaryIcon} />
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>{totalItens}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="resize" size={16} color="#666" style={styles.summaryIcon} />
            <Text style={styles.summaryLabel}>Área Total:</Text>
            <Text style={styles.summaryValue}>
              {quarteiroesFiltrados.reduce((sum, q) => sum + q.area, 0).toFixed(1)} ha
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.summaryIcon} />
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
                {editando ? 'Editar Quarteirão' : 'Novo Quarteirão'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView ref={modalScrollRef} style={styles.modalForm} nestedScrollEnabled>
              {/* Mapa */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Polígono no Mapa *</Text>
                <QuarteiraoMapWebView
                  ref={mapRef}
                  initialPolygon={mapData?.geojson ?? null}
                  onReady={() => setMapReady(true)}
                  onPolygonChanged={(data) => setMapData(data)}
                  parentScrollRef={modalScrollRef}
                  height={300}
                />
                {/* Preview dos dados capturados */}
                <View style={styles.mapPreview}>
                  <Text style={styles.mapPreviewText}>
                    {mapData
                      ? `✅ Polígono capturado  |  Centro: ${mapData.centroid.lat.toFixed(5)}, ${mapData.centroid.lng.toFixed(5)}  |  Área: ${(mapData.area_m2 / 10000).toFixed(2)} ha`
                      : '⚠️ Nenhum polígono desenhado'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.locationButton} onPress={detectarLocalizacao}>
                  <Ionicons name="locate" size={16} color="#fff" />
                  <Text style={styles.locationButtonText}>Detectar localização atual</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Número do Quarteirão *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 1"
                  value={formData.numero}
                  onChangeText={(text) => setFormData({ ...formData, numero: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Quarteirão *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Quarteirão Norte"
                  value={formData.nome}
                  onChangeText={(text) => setFormData({ ...formData, nome: text.toUpperCase() })}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Localidade *</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                    {localidades.map((loc) => (
                      <TouchableOpacity
                        key={loc.id_localidade}
                        style={[
                          styles.pickerOption,
                          formData.localidade === loc.nome_localidade && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, localidade: loc.nome_localidade })}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          formData.localidade === loc.nome_localidade && styles.pickerOptionTextSelected
                        ]}>
                          {formData.localidade === loc.nome_localidade ? '✓ ' : ''}{loc.nome_localidade}{loc.co_localidade ? ` - ${loc.co_localidade}` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zona *</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                    {zonas.map((zona) => (
                      <TouchableOpacity
                        key={zona.id_zona}
                        style={[
                          styles.pickerOption,
                          formData.zona === zona.nome_zona && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, zona: zona.nome_zona })}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          formData.zona === zona.nome_zona && styles.pickerOptionTextSelected
                        ]}>
                          {formData.zona === zona.nome_zona ? '✓ ' : ''}{zona.nome_zona}{zona.co_zona ? ` - ${zona.co_zona}` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Área (hectares) (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 5.2"
                  value={formData.area}
                  onChangeText={(text) => setFormData({ ...formData, area: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição (opcional)</Text>
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
                <Text style={styles.label}>Status</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    key="ativo"
                    style={styles.radioButton}
                    onPress={() => setFormData({ ...formData, status: 'Ativo' })}
                  >
                    <Ionicons 
                      name={formData.status === 'Ativo' ? 'radio-button-on' : 'radio-button-off'} 
                      size={24} 
                      color={formData.status === 'Ativo' ? '#4CAF50' : '#999'} 
                    />
                    <Text style={styles.radioLabel}>Ativo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    key="inativo"
                    style={styles.radioButton}
                    onPress={() => setFormData({ ...formData, status: 'Inativo' })}
                  >
                    <Ionicons 
                      name={formData.status === 'Inativo' ? 'radio-button-on' : 'radio-button-off'} 
                      size={24} 
                      color={formData.status === 'Inativo' ? '#FF9800' : '#999'} 
                    />
                    <Text style={styles.radioLabel}>Inativo</Text>
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
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={salvarQuarteirao}
              >
                <Text style={styles.saveButtonText}>
                  {editando ? 'Atualizar' : 'Cadastrar'}
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
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#333',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
    gap: 8,
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
  // Mapa
  mapPreview: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#F0F4F0',
    borderRadius: 6,
  },
  mapPreviewText: {
    fontSize: 12,
    color: '#444',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  // Picker styles
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
});

export default CadastroQuarteirao;