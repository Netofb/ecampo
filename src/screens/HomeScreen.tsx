// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, getApiUrlForDisplay } from '../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navgation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;



// Tipos para os dados
interface CardData {
  id: number;
  title: string;
  value: string;
  icon: string;
  color: string;
  description?: string;
}

interface DropdownItem {
  id: number;
  label: string;
  screen: string;
  icon?: string;
}

interface MenuItem {
  id: number;
  title: string;
  icon: string;
  hasDropdown: boolean;
  screen?: string;
  dropdownItems?: DropdownItem[];
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userIbge, setUserIbge] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);

  // Itens do menu lateral com navegação
  const menuItems: MenuItem[] = [
    { 
      id: 1, 
      title: 'Cadastros', 
      icon: 'create-outline', 
      hasDropdown: true,
      dropdownItems: [
        { id: 11, label: 'Cadastrar Quarteirão', screen: 'CadastroQuarteirao', icon: 'location-outline' },
        { id: 12, label: 'Cadastrar Face', screen: 'CadastroFace', icon: 'home-outline' },
        { id: 13, label: 'Cadastrar Imóvel', screen: 'CadastroImovel', icon: 'business-outline' },
       
      ]
    },
    { 
      id: 2, 
      title: 'Produção', 
      icon: 'clipboard-outline', 
      hasDropdown: true,
      dropdownItems: [
        { id: 21, label: 'Registrar atividade', screen: 'ProducaoInicio', icon: 'add-circle-outline' },
      ]
    },
    { 
      id: 3, 
      title: 'Relatórios', 
      icon: 'stats-chart-outline', 
      hasDropdown: true,
      dropdownItems: [
        { id: 31, label: 'Relatório Geral', screen: 'RelatorioGeral', icon: 'trending-up-outline' },
        { id: 32, label: 'Relatório Financeiro', screen: 'RelatorioFinanceiro', icon: 'cash-outline' },
        { id: 33, label: 'Exportar Dados', screen: 'ExportarDados', icon: 'cloud-upload-outline' },
      ]
    },
    { 
      id: 4, 
      title: 'Mapas', 
      icon: 'map-outline', 
      hasDropdown: true,
      dropdownItems: [
        { id: 41, label: 'Mapa de Quarteirões', screen: 'MapaQuarteiroes', icon: 'location-outline' },
        { id: 42, label: 'Mapa de Faces', screen: 'MapaFaces', icon: 'grid-outline' },
        { id: 43, label: 'Mapa de Imóveis', screen: 'MapaImoveis', icon: 'business-outline' },
      ]
    },
    // Itens SEM dropdown (vão direto para uma tela)
    { 
      id: 5, 
      title: 'Configurações', 
      icon: 'settings-outline', 
      hasDropdown: false,
      screen: 'Configuracoes'
    },
    { 
      id: 6, 
      title: 'Ajuda', 
      icon: 'help-circle-outline', 
      hasDropdown: false,
      screen: 'Ajuda'
    },
  ];

  // Mapeamento para navegação dos cards
  const cardNavigation: Record<number, string> = {
    1: 'CadastroQuarteirao',
    2: 'CadastroFace',
    3: 'CadastroImovel',
    4: 'Localidades',
  };

  useEffect(() => {
    loadUserData();
    // Carrega stats em background sem bloquear a UI
    setTimeout(() => loadStats(), 100);
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const ibge = await AsyncStorage.getItem('userIbge');
      const photo = await AsyncStorage.getItem('userPhoto');
      
      if (name) setUserName(name);
      if (ibge) setUserIbge(ibge);
      if (photo) setUserPhoto(photo);
      
      // Define cards vazios imediatamente
      setCards([
        { id: 1, title: 'Quarteirões Cadastrados', value: '', icon: 'location', color: '#4CAF50' },
        { id: 2, title: 'Faces cadastradas', value: '', icon: 'home', color: '#2196F3' },
        { id: 3, title: 'Imóveis Cadastrados', value: '', icon: 'business', color: '#FF9800' },
        { id: 4, title: 'Localidades Cadastradas', value: '', icon: 'map', color: '#9C27B0' },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const apiUrl = getApiUrlForDisplay();
      const response = await fetch(`${apiUrl}/stats`, {
        headers: authService.getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Erro ao carregar estatísticas');
      
      const data = await response.json();

      setCards([
        {
          id: 1,
          title: 'Quarteirões Cadastrados',
          value: String(data.quarteiroes || 0),
          icon: 'location',
          color: '#4CAF50',
        },
        {
          id: 2,
          title: 'Faces cadastradas',
          value: String(data.faces || 0),
          icon: 'home',
          color: '#2196F3',
        },
        {
          id: 3,
          title: 'Imóveis Cadastrados',
          value: String(data.imoveis || 0),
          icon: 'business',
          color: '#FF9800',
        },
        {
          id: 4,
          title: 'Localidades Cadastradas',
          value: String(data.localidades || 0),
          icon: 'map',
          color: '#9C27B0',
        },
      ]);
    } catch (error) {
      // Silently fail
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const toggleDropdown = (id: number) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleNavigation = (screenName: string) => {
    // Fecha o menu e dropdown
    setMenuOpen(false);
    setActiveDropdown(null);
    
    // Navega para a tela
    navigation.navigate(screenName as never);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando...</Text>
      </View>
    );
  }

  return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {/* Menu Hamburguer (Esquerda) */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuOpen(!menuOpen)}
          >
            <Ionicons name={menuOpen ? 'close' : 'menu'} size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Logo (Centro) */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logoEcampo.png')}
              style={styles.LogoEcampo}
            /> 
          </View>

          {/* Perfil (Direita) */}
          <View style={styles.profileButton}>
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitials}>
                {userName ? userName.charAt(0) : 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {userName || 'Usuário'}
              </Text>
              <Text style={[styles.profileIbge, { color: colors.textSecondary }]}>
                {userIbge || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Conteúdo Principal */}
        <View style={styles.mainContainer}>
          {/* Menu Lateral (condicional) */}
          {menuOpen && (
            <View style={[styles.sideMenu, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
              <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Menu</Text>
              </View>
              <ScrollView style={styles.menuItems}>
                {menuItems.map((item) => (
                  <View key={item.id}>
                    {/* Item principal do menu */}
                    <TouchableOpacity
                      style={[styles.menuItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        if (item.hasDropdown) {
                          toggleDropdown(item.id);
                        } else if (item.screen) {
                          handleNavigation(item.screen);
                        }
                      }}
                    >
                      <View style={styles.menuItemLeft}>
                        <Ionicons name={item.icon as any} size={20} color={colors.text} style={styles.menuItemIcon} />
                        <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
                      </View>
                      {item.hasDropdown && (
                        <Ionicons name={activeDropdown === item.id ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                    
                    {/* Dropdown com itens navegáveis */}
                    {activeDropdown === item.id && item.hasDropdown && item.dropdownItems && (
                      <View style={[styles.dropdownContent, { backgroundColor: isDark ? colors.background : '#F9F9F9' }]}>
                        {item.dropdownItems.map((dropdownItem) => (
                          <TouchableOpacity 
                            key={dropdownItem.id}
                            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                            onPress={() => handleNavigation(dropdownItem.screen)}
                          >
                            {dropdownItem.icon && (
                              <Ionicons name={dropdownItem.icon as any} size={18} color={colors.textSecondary} style={styles.dropdownItemIcon} />
                            )}
                            <Text style={[styles.dropdownItemText, { color: colors.textSecondary }]}>{dropdownItem.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
              
              {/* Footer do Menu */}
              <View style={[styles.menuFooter, { borderTopColor: colors.border }]}>
              
                
                <TouchableOpacity 
                  style={styles.logoutMenuButton} 
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} style={styles.logoutIcon} />
                  <Text style={[styles.logoutMenuText, { color: colors.danger }]}>Sair</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Conteúdo Principal (Cards) */}
          <ScrollView style={[styles.content, menuOpen && styles.contentWithMenu]}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>Bem-vindo de volta!</Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Aqui está um resumo das suas métricas</Text>
            
            <View style={styles.cardsContainer}>
              {cards.map((card) => (
                <View key={card.id} style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconContainer, { backgroundColor: `${card.color}20` }]}>
                      <Ionicons name={card.icon as any} size={24} color={card.color} />
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{card.title}</Text>
                  </View>
                  
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardValue, { color: colors.text }]}>{card.value}</Text>
                    {card.description && (
                      <Text style={styles.cardDescription}>{card.description}</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.cardButton}
                    onPress={() => {
                      const screen = cardNavigation[card.id];
                      if (screen) {
                        navigation.navigate(screen as never);
                      }
                    }}
                  >
                    <Text style={[styles.cardButtonText, { color: card.color }]}>
                      Ver detalhes
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={card.color} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            <View style={styles.spacer} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  LogoEcampo: {
    height: 40,
    width: 40,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#E5E5EA',
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileIbge: {
    fontSize: 12,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sideMenu: {
    width: 280,
    borderRightWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
  },

  dropdownContent: {
    paddingLeft: 52,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  dropdownItemIcon: {
    marginRight: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    flex: 1,
  },

  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingsIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  settingsText: {
    fontSize: 14,
    color: '#666',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  helpIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
  },
  logoutMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutMenuText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentWithMenu: {
    // Estilo quando o menu está aberto
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 48) / 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  cardTitle: {
    fontSize: 14,
    flex: 1,
  },
  cardContent: {
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#888',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },

  spacer: {
    height: 100,
  },
});

export default HomeScreen;