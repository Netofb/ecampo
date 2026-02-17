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
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navgation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userIbge, setUserIbge] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Dados dos cards (usando texto/emoji)
  const cards: CardData[] = [
    {
      id: 1,
      title: 'Quarteirões Cadastrados',
      value: '34',
      icon: '📍',
      color: '#4CAF50',
    },
    {
      id: 2,
      title: 'Faces cadastradas',
      value: '66',
      icon: '🏠',
      color: '#2196F3',
    },
    {
      id: 3,
      title: 'Imóveis Cadastrados',
      value: '37',
      icon: '🏢',
      color: '#FF9800',
    },
    {
      id: 4,
      title: 'Localidades Cadastradas',
      value: '1',
      icon: '🗺️',
      color: '#9C27B0',
    },
  ];

  // Itens do menu lateral com navegação
  const menuItems: MenuItem[] = [
    { 
      id: 1, 
      title: 'Cadastros', 
      icon: '📝', 
      hasDropdown: true,
      dropdownItems: [
        { id: 11, label: 'Cadastrar Quarteirão', screen: 'CadastroQuarteirao', icon: '📍' },
        { id: 12, label: 'Cadastrar Face', screen: 'CadastroFace', icon: '🏠' },
        { id: 13, label: 'Cadastrar Imóvel', screen: 'CadastroImovel', icon: '🏢' },
       
      ]
    },
    { 
      id: 2, 
      title: 'Produção', 
      icon: '⚙️', 
      hasDropdown: true,
      dropdownItems: [
        { id: 21, label: 'Iniciar Produção', screen: 'ProducaoInicio', icon: '🚜' },
        { id: 22, label: 'Controle Diário', screen: 'ProducaoControle', icon: '📋' },
        { id: 23, label: 'Histórico', screen: 'ProducaoHistorico', icon: '📊' },
      ]
    },
    { 
      id: 3, 
      title: 'Relatórios', 
      icon: '📊', 
      hasDropdown: true,
      dropdownItems: [
        { id: 31, label: 'Relatório Geral', screen: 'RelatorioGeral', icon: '📈' },
        { id: 32, label: 'Relatório Financeiro', screen: 'RelatorioFinanceiro', icon: '💰' },
        { id: 33, label: 'Exportar Dados', screen: 'ExportarDados', icon: '📤' },
      ]
    },
    { 
      id: 4, 
      title: 'Mapas', 
      icon: '🗺️', 
      hasDropdown: true,
      dropdownItems: [
        { id: 41, label: 'Mapa Geral', screen: 'Mapa', icon: '🗺️' },
        { id: 42, label: 'Mapa de Quarteirões', screen: 'MapaPropriedade', icon: '📍' },
        { id: 43, label: 'Mapa de Faces', screen: 'MapaProducao', icon: '🏘️' },
        { id: 44, label: 'Mapa de Imóveis', screen: 'GPS', icon: '🏢' },
      ]
    },
    // Itens SEM dropdown (vão direto para uma tela)
    { 
      id: 5, 
      title: 'Configurações', 
      icon: '⚙️', 
      hasDropdown: false,
      screen: 'Configuracoes'
    },
    { 
      id: 6, 
      title: 'Ajuda', 
      icon: '❓', 
      hasDropdown: false,
      screen: 'Ajuda'
    },
  ];

  // Mapeamento para navegação dos cards
  const cardNavigation: Record<number, string> = {
    1: 'Quarteiroes',
    2: 'Faces',
    3: 'Imoveis',
    4: 'Localidades',
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const ibge = await AsyncStorage.getItem('userIbge');
      const photo = await AsyncStorage.getItem('userPhoto');
      
      if (name) setUserName(name);
      if (ibge) setUserIbge(ibge);
      if (photo) setUserPhoto(photo);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
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
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userCPF');
            await authService.logout();
            // O AppNavigator vai detectar automaticamente e redirecionar para Login
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
            <Text style={[styles.menuIcon, { color: colors.text }]}>{menuOpen ? '✕' : '☰'}</Text>
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
                        <Text style={styles.menuItemIcon}>{item.icon}</Text>
                        <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
                      </View>
                      {item.hasDropdown && (
                        <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>
                          {activeDropdown === item.id ? '▲' : '▼'}
                        </Text>
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
                              <Text style={styles.dropdownItemIcon}>{dropdownItem.icon}</Text>
                            )}
                            <Text style={[styles.dropdownItemText, { color: colors.textSecondary }]}>{dropdownItem.label}</Text>
                            <Text style={[styles.chevronRight, { color: colors.textSecondary }]}>{'›'}</Text>
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
                  <Text style={styles.logoutIcon}>🚪</Text>
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
                      <Text style={[styles.cardIcon, { color: card.color }]}>{card.icon}</Text>
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
                    <Text style={[styles.chevron, { color: card.color }]}>{'›'}</Text>
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
    fontSize: 20,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  dropdownIcon: {
    fontSize: 12,
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
    fontSize: 16,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    flex: 1,
  },
  chevronRight: {
    fontSize: 18,
    marginLeft: 8,
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
    fontSize: 18,
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
  cardIcon: {
    fontSize: 20,
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
  chevron: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spacer: {
    height: 100,
  },
});

export default HomeScreen;