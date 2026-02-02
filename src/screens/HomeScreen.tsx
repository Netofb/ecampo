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
import { supabase } from '../services/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navgation/AppNavigator';
// Importe do safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
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
        { id: 14, label: 'Cadastrar Localidade', screen: 'CadastroLocalidade', icon: '🗺️' },
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
        { id: 41, label: 'Mapa da Propriedade', screen: 'MapaPropriedade', icon: '📍' },
        { id: 42, label: 'Mapa de Produção', screen: 'MapaProducao', icon: '🌱' },
        { id: 43, label: 'GPS Tracking', screen: 'GPS', icon: '🎯' },
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
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
            await supabase.auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
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
    
    // Log para debug (remova depois)
    console.log(`Navegando para: ${screenName}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          {/* Menu Hamburguer (Esquerda) */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuOpen(!menuOpen)}
          >
            <Text style={styles.menuIcon}>{menuOpen ? '✕' : '☰'}</Text>
          </TouchableOpacity>

          {/* Logo (Centro) */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logoEcampo.png')}
              style={styles.LogoEcampo}
            /> 
          </View>

          {/* Perfil (Direita) */}
          <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
            <Text style={styles.profileIcon}>👤</Text>
            <Text style={styles.profileText} numberOfLines={1}>
              {userEmail || 'Usuário'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo Principal */}
        <View style={styles.mainContainer}>
          {/* Menu Lateral (condicional) */}
          {menuOpen && (
            <View style={styles.sideMenu}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Menu</Text>
              </View>
              <ScrollView style={styles.menuItems}>
                {menuItems.map((item) => (
                  <View key={item.id}>
                    {/* Item principal do menu */}
                    <TouchableOpacity
                      style={styles.menuItem}
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
                        <Text style={styles.menuItemText}>{item.title}</Text>
                      </View>
                      {item.hasDropdown && (
                        <Text style={styles.dropdownIcon}>
                          {activeDropdown === item.id ? '▲' : '▼'}
                        </Text>
                      )}
                    </TouchableOpacity>
                    
                    {/* Dropdown com itens navegáveis */}
                    {activeDropdown === item.id && item.hasDropdown && item.dropdownItems && (
                      <View style={styles.dropdownContent}>
                        {item.dropdownItems.map((dropdownItem) => (
                          <TouchableOpacity 
                            key={dropdownItem.id}
                            style={styles.dropdownItem}
                            onPress={() => handleNavigation(dropdownItem.screen)}
                          >
                            {dropdownItem.icon && (
                              <Text style={styles.dropdownItemIcon}>{dropdownItem.icon}</Text>
                            )}
                            <Text style={styles.dropdownItemText}>{dropdownItem.label}</Text>
                            <Text style={styles.chevronRight}>{'›'}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
              
              {/* Footer do Menu */}
              <View style={styles.menuFooter}>
              
                
                <TouchableOpacity 
                  style={styles.logoutMenuButton} 
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutIcon}>🚪</Text>
                  <Text style={styles.logoutMenuText}>Sair</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Conteúdo Principal (Cards) */}
          <ScrollView style={[styles.content, menuOpen && styles.contentWithMenu]}>
            <Text style={styles.welcomeTitle}>Bem-vindo de volta!</Text>
            <Text style={styles.welcomeSubtitle}>Aqui está um resumo das suas métricas</Text>
            
            <View style={styles.cardsContainer}>
              {cards.map((card) => (
                <View key={card.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconContainer, { backgroundColor: `${card.color}20` }]}>
                      <Text style={[styles.cardIcon, { color: card.color }]}>{card.icon}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                  </View>
                  
                  <View style={styles.cardContent}>
                    <Text style={styles.cardValue}>{card.value}</Text>
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
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
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
    minWidth: 100,
    maxWidth: 150,
  },
  profileIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  profileText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sideMenu: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    borderBottomColor: '#F5F5F7',
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
    color: '#333',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  dropdownContent: {
    backgroundColor: '#F9F9F9',
    paddingLeft: 52,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  chevronRight: {
    fontSize: 18,
    color: '#999',
    marginLeft: 8,
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
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
    color: '#FF3B30',
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
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
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
    color: '#666',
    flex: 1,
  },
  cardContent: {
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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