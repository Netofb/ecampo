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
  SafeAreaView,
  StatusBar,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { faceService, quarteiraoService, authService } from '../../services/api';
import { addFaceLocal, listFacesLocais, updateFaceLocal } from '../../services/faceLocal';
import FacesMapWebView from '../../components/FacesMapWebView';
import FaceLineMapEditor, { FaceLineMapData } from '../../components/FaceLineMapEditor';
import { useTheme } from '../../contexts/ThemeContext';

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
  local_id?: string;
}

const CadastroFace: React.FC = () => {
  const PAGE_SIZE = 20;
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [faceEditando, setFaceEditando] = useState<Face | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  
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
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const lastSavedEditRef = useRef<string | null>(null);
  const originalEditRef = useRef<{ formData: typeof formData; faceMapData: FaceLineMapData | null; face: Face } | null>(null);

  const quarteiraoSelecionado = quarteiroes.find(
    (quarteirao) => quarteirao.id_quadra?.toString() === formData.id_quarteirao
  );

  const poligonoQuarteirao = (() => {
    const value = quarteiraoSelecionado?.poligono_geojson || quarteiraoSelecionado?.geojson;
    if (!value || typeof value === 'object') return value || null;
    try { return JSON.parse(value); } catch { return null; }
  })();

  const facesFiltradas = faces.filter(face =>
    face.numero_face.toString().includes(busca) ||
    (face.nome_quadra || '').toLowerCase().includes(busca.toLowerCase())
  ).sort((a, b) => a.numero_face - b.numero_face);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [busca]);

  const facesVisiveis = facesFiltradas.slice(0, visibleCount);

  useEffect(() => {
    if (!modalVisible || !editando || !faceEditando || !faceMapData) return;
    const snapshot = JSON.stringify({ formData, faceMapData });
    if (lastSavedEditRef.current === null) {
      lastSavedEditRef.current = snapshot;
      return;
    }
    if (snapshot === lastSavedEditRef.current) return;

    setAutoSaveStatus('saving');
    const timeout = setTimeout(async () => {
      const payload = {
        numero_face: Number.parseInt(formData.numero_face, 10),
        id_quarteirao: Number.parseInt(formData.id_quarteirao, 10),
        nome_linha: formData.nome_linha,
        status: formData.status,
        linha_geojson: faceMapData.geojson,
        cor_linha: faceColor,
        latitude: faceMapData.centroid.lat,
        longitude: faceMapData.centroid.lng,
      };
      try {
        if (faceEditando.local_id) {
          await updateFaceLocal(faceEditando.local_id, payload);
        } else {
          await faceService.update(faceEditando.id_face, payload);
        }
        lastSavedEditRef.current = snapshot;
        setAutoSaveStatus('saved');
        setFaces(current => current.map(face => face.id_face === faceEditando.id_face ? { ...face, ...payload } : face));
        setMapRefreshKey(value => value + 1);
      } catch {
        setAutoSaveStatus('error');
      }
    }, 700);
    return () => clearTimeout(timeout);
  }, [modalVisible, editando, faceEditando, formData, faceMapData, faceColor]);

  const carregarFaces = async () => {
    try {
      setLoading(true);
      const data = await faceService.list();
      setFaces(data);
      setVisibleCount(PAGE_SIZE);
    } catch (error) {
      const locais = await listFacesLocais();
      setFaces(locais.map((face, index) => ({
        ...face,
        id_face: -(index + 1),
        local_id: face.id_face,
        nome_quadra: 'Quarteirão local',
        numero_quadra: 0,
      })));
      setVisibleCount(PAGE_SIZE);
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
    lastSavedEditRef.current = null;
    originalEditRef.current = null;
    setAutoSaveStatus('saved');
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
    lastSavedEditRef.current = null;
    setAutoSaveStatus('saved');
    setEditando(true);
    setFaceEditando(face);
    const initialFormData = {
      numero_face: face.numero_face.toString(),
      id_quarteirao: face.id_quarteirao.toString(),
      nome_linha: (face as any).nome_linha || '',
      status: face.status,
    };
    const linhaExistente = typeof face.linha_geojson === 'string' ? (() => {
      try { return JSON.parse(face.linha_geojson); } catch { return null; }
    })() : face.linha_geojson;
    const initialFaceMapData = linhaExistente ? { geojson: linhaExistente, centroid: { lat: Number(face.latitude), lng: Number(face.longitude) } } : null;
    originalEditRef.current = { formData: initialFormData, faceMapData: initialFaceMapData, face };
    setFormData(initialFormData);
    setFaceMapData(initialFaceMapData);
    setSeletorAberto(null);
    setModalVisible(true);
  };

  const cancelarAtualizacao = async () => {
    const original = originalEditRef.current;
    if (!original) {
      setModalVisible(false);
      return;
    }
    setAutoSaveStatus('saving');
    const payload = {
      numero_face: Number.parseInt(original.formData.numero_face, 10),
      id_quarteirao: Number.parseInt(original.formData.id_quarteirao, 10),
      nome_linha: original.formData.nome_linha,
      status: original.formData.status,
      linha_geojson: original.faceMapData?.geojson ?? null,
      cor_linha: original.face.cor_linha || faceColor,
      latitude: original.faceMapData?.centroid.lat ?? null,
      longitude: original.faceMapData?.centroid.lng ?? null,
    };
    try {
      if (original.face.local_id) {
        await updateFaceLocal(original.face.local_id, payload);
      } else {
        await faceService.update(original.face.id_face, payload);
      }
      setFormData(original.formData);
      setFaceMapData(original.faceMapData);
      setFaces(current => current.map(face => face.id_face === original.face.id_face ? { ...face, ...payload } : face));
      lastSavedEditRef.current = JSON.stringify({ formData: original.formData, faceMapData: original.faceMapData });
      setAutoSaveStatus('saved');
      setMapRefreshKey(value => value + 1);
      setModalVisible(false);
    } catch {
      setAutoSaveStatus('error');
      Alert.alert('Erro', 'Não foi possível cancelar a atualização e restaurar os dados originais.');
    }
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
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} key={face.id_face}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.numeroContainer}>
              <Ionicons name="git-branch-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.nomeContainer}>
              <Text style={[styles.nomeText, { color: colors.text }]}>Face {face.numero_face}</Text>
              <Text style={[styles.numeroQuarteiraoText, { color: colors.textSecondary }]}>{face.nome_quadra || 'Quarteirão'} · QUARTEIRÃO {face.numero_quadra || '-'}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, face.status === 'Ativo' ? styles.activePill : styles.inactivePill]}>
            <Text style={[styles.statusPillText, face.status === 'Ativo' ? styles.activePillText : styles.inactivePillText]}>
              {face.status}
            </Text>
          </View>
        </View>

        <FacesMapWebView refreshKey={mapRefreshKey} faceId={face.id_face} />

        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.tableHeaderText, { color: colors.textSecondary }, styles.nameColumn]}>NOME DA LINHA</Text>
          <Text style={[styles.tableHeaderText, { color: colors.textSecondary }, styles.actionsColumn]}>AÇÕES</Text>
        </View>

        <View style={styles.faceRow}>
          <View style={[styles.faceColumn, styles.faceNumberCell]}>
            <View style={styles.faceLine} />
            <Text style={[styles.faceNumberText, { color: colors.text }]}>{(face as any).nome_linha || 'Linha da face'}</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Faces Cadastradas</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholderTextColor={colors.placeholder}
            placeholder="Buscar face ou quarteirão..."
            value={busca}
            onChangeText={setBusca}
            clearButtonMode="while-editing"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.clearButton}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.controls, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.newButton, { backgroundColor: colors.primary }]}
          onPress={abrirModalCadastro}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" style={styles.plusIcon} />
          <Text style={styles.newButtonText}>Nova Face</Text>
        </TouchableOpacity>

      </View>

      {loading && faces.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando faces...</Text>
        </View>
      ) : facesFiltradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color="#ccc" />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {busca ? 'Nenhuma face encontrada' : 'Nenhuma face cadastrada'}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView 
            style={styles.scrollContainer}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 160) {
                setVisibleCount((current) => Math.min(current + PAGE_SIZE, facesFiltradas.length));
              }
            }}
            scrollEventThrottle={200}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.facesList}>
              {facesVisiveis.map(renderFaceCard)}
            </View>
          </ScrollView>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
          onRequestClose={() => { if (autoSaveStatus !== 'saving') { setSeletorAberto(null); setModalVisible(false); } }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editando ? 'Editar Face' : 'Nova Face'}
              </Text>
              <TouchableOpacity 
                onPress={() => { if (autoSaveStatus !== 'saving') { setSeletorAberto(null); setModalVisible(false); } }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} contentContainerStyle={styles.modalFormContent} keyboardShouldPersistTaps="handled">
              <View style={[styles.formColumns, editando && styles.formColumnsVertical]}>
              <View style={[styles.inputGroup, styles.columnSmall]}>
                <Text style={[styles.label, { color: colors.text }]}>Número da Face *</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]}
                  placeholderTextColor={colors.placeholder}
                  placeholder="Ex: 1"
                  value={formData.numero_face}
                  onChangeText={(text) => setFormData({ ...formData, numero_face: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.columnSmall]}>
                <Text style={[styles.label, { color: colors.text }]}>Status</Text>
                <TouchableOpacity style={[styles.selectField, { backgroundColor: colors.input, borderColor: colors.border }]} onPress={() => setSeletorAberto('status')}>
                  <Text style={[styles.selectText, { color: colors.text }]}>{formData.status}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, styles.columnMedium]}>
                <Text style={[styles.label, { color: colors.text }]}>Selecione o quarteirão *</Text>
                <TouchableOpacity style={[styles.selectField, { backgroundColor: colors.input, borderColor: colors.border }]} onPress={() => setSeletorAberto('quarteirao')}>
                  <Text style={[styles.selectText, { color: colors.text }]} numberOfLines={1}>{quarteiroes.find((q) => q.id_quadra.toString() === formData.id_quarteirao)?.nome_quadra || 'Selecione'}</Text><Ionicons name="chevron-down" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
              </View>

              <View style={[styles.formColumns, editando && styles.formColumnsVertical]}>
              <View style={[styles.inputGroup, styles.columnWide]}>
                <Text style={[styles.label, { color: colors.text }]}>Nome da linha/polígono da face</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]}
                  placeholderTextColor={colors.placeholder}
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

              <View style={[styles.helpBox, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.helpTitle, { color: colors.text } ]}>ⓘ Selecione as arestas da face:</Text><Text style={[styles.helpText, { color: colors.textSecondary }]}>• Os lados do quarteirão aparecem em verde.{`\n`}• Toque em cada aresta que pertence à face.{`\n`}• Toque novamente para remover uma seleção.</Text></View>
              <FaceLineMapEditor
                height={220}
                center={{ lat: Number(quarteiraoSelecionado?.latitude_quadra) || -8.3797, lng: Number(quarteiraoSelecionado?.longitude_quadra) || -35.4508 }}
                initialPolygon={poligonoQuarteirao}
                initialLine={faceMapData?.geojson || null}
                color={faceColor}
                onLineChanged={setFaceMapData}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { if (autoSaveStatus === 'saving') return; setSeletorAberto(null); setModalVisible(false); }}
                disabled={autoSaveStatus === 'saving'}
              >
                <Text style={styles.cancelButtonText}>{editando ? 'Fechar' : 'Cancelar'}</Text>
              </TouchableOpacity>
              
              {editando && <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelarAtualizacao}
                disabled={autoSaveStatus === 'saving'}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>}

              {editando ? (
                <Text numberOfLines={2} style={{ color: autoSaveStatus === 'error' ? '#C62828' : colors.textSecondary, alignSelf: 'center', flexShrink: 1, fontSize: 12, marginHorizontal: 4 }}>
                  {autoSaveStatus === 'saving' ? 'Salvando alterações…' : autoSaveStatus === 'error' ? 'Falha ao salvar. Tente novamente.' : 'Alterações salvas automaticamente'}
                </Text>
              ) : <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={salvarFace}
              >
                <Text style={styles.saveButtonText}>Cadastrar</Text>
              </TouchableOpacity>}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={seletorAberto !== null} transparent animationType="fade" onRequestClose={() => setSeletorAberto(null)}>
        <View style={styles.selectorOverlay}>
          <View style={[styles.selectorContent, { backgroundColor: colors.card }]}>
            <View style={styles.selectorHeader}>
              <Text style={[styles.selectorTitle, { color: colors.text }]}>{seletorAberto === 'quarteirao' ? 'Selecione o quarteirão' : 'Selecione o status'}</Text>
              <TouchableOpacity onPress={() => setSeletorAberto(null)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectorList} contentContainerStyle={styles.selectorListContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
              {seletorAberto === 'status' && (['Ativo', 'Inativo'] as const).map((status) => <TouchableOpacity key={status} style={styles.dropdownOption} onPress={() => { setFormData({ ...formData, status }); setSeletorAberto(null); }}>
                <Text style={[styles.dropdownOptionText, { color: colors.text }, formData.status === status && { color: colors.primary }]}>{formData.status === status ? '✓ ' : ''}{status}</Text>
              </TouchableOpacity>)}
              {seletorAberto === 'quarteirao' && quarteiroes.map((q) => <TouchableOpacity key={q.id_quadra} style={styles.dropdownOption} onPress={() => { const idQuarteirao = q.id_quadra.toString(); if (formData.id_quarteirao !== idQuarteirao) setFaceMapData(null); setFormData({ ...formData, id_quarteirao: idQuarteirao }); setSeletorAberto(null); }}>
                <Text style={[styles.dropdownOptionText, { color: colors.text }, formData.id_quarteirao === q.id_quadra.toString() && { color: colors.primary }]}>{formData.id_quarteirao === q.id_quadra.toString() ? '✓ ' : ''}{q.nome_quadra} - Nº {q.numero_quadra}</Text>
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
    paddingHorizontal: 30,
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
    paddingHorizontal: 30,
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
    paddingHorizontal: 30,
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
    paddingHorizontal: 30,
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
