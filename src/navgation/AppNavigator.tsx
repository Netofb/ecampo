// src/navigation/AppNavigator.tsx - VERSÃO COMPLETA COM TODAS AS TELAS
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { ThemedScreen } from '../components/ThemedScreen';
import { useTheme } from '../contexts/ThemeContext';
// TELAS DE AUTENTICAÇÃO
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// TELA PRINCIPAL
import HomeScreen from '../screens/HomeScreen';

// TELAS DE CADASTRO (importe as que você criou)
import CadastroFace from '../screens/screensCadastro/CadastroFace';
import CadastroQuarteirao from '../screens/screensCadastro/CadastroQuarteirao';
import CadastroImovel from '../screens/screensCadastro/CadastroImovel';


// TELAS DE PRODUÇÃO
import ProducaoInicio from '../screens/screensProducao/ProducaoInicio';
import ProducaoControle from '../screens/screensProducao/ProducaoControle';
import ProducaoHistorico from '../screens/screensProducao/ProducaoHistorico';

// TELAS DE RELATÓRIOS
import RelatorioGeral from '../screens/screensRelatorio/RelatorioGeral';
import RelatorioFinanceiro from '../screens/screensRelatorio/RelatorioFinanceiro';
import ExportarDados from '../screens/screensOutros/ExportarDados';

// TELAS DE MAPAS
import MapaQuarteiroes from '../screens/screensMapa/MapaQuarteiroes';
import MapaFaces from '../screens/screensMapa/MapaFaces';
import MapaImoveis from '../screens/screensMapa/MapaImoveis';
import GPS from '../screens/screensOutros/GPS';

// OUTRAS TELAS
import Configuracoes from '../screens/screensOutros/Configuracoes';
import Ajuda from '../screens/screensOutros/Ajuda';
import Quarteiroes from '../screens/Quarteiroes';
import Faces from '../screens/screensOutros/Faces';
import Localidades from '../screens/Localidades';

// Defina TODOS os tipos de tela
export type RootStackParamList = {
  // Autenticação
  Login: undefined;
  Register: undefined;
  
  // Principal
  Home: undefined;
  
  // Cadastros
  CadastroFace: undefined;
  CadastroQuarteirao: undefined;
  CadastroImovel: undefined;
  CadastroLocalidade: undefined;
  
  // Produção
  ProducaoInicio: undefined;
  ProducaoControle: undefined;
  ProducaoHistorico: undefined;
  
  // Relatórios
  RelatorioGeral: undefined;
  RelatorioFinanceiro: undefined;
  ExportarDados: undefined;
  
  // Mapas
  MapaQuarteiroes: undefined;
  MapaFaces: undefined;
  MapaImoveis: undefined;
  GPS: undefined;
  
  // Outros
  Configuracoes: undefined;
  Ajuda: undefined;
  Quarteiroes: undefined;
  Faces: undefined;
  Localidades: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userId = await AsyncStorage.getItem('userId');
        const userIbge = await AsyncStorage.getItem('userIbge');
        
        if (token && userId) {
          authService.setToken(token);
          authService.setUserId(userId);
          if (userIbge) {
            authService.setUserIbge(userIbge);
          }
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: colors.text,
          },
        }}
      >
        {isLoggedIn === false ? (
          // USUÁRIO NÃO LOGADO - TELAS PÚBLICAS
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ title: 'Login - ecampo' }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ title: 'Cadastro - ecampo' }}
            />
          </>
        ) : (
          // USUÁRIO LOGADO - TELAS PRIVADAS
          <>
            {/* TELA PRINCIPAL */}
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                title: 'eCampo - Inicio',
                headerLeft: () => null, // Remove botão voltar na Home
              }}
            />
            
            {/* TELAS DE CADASTRO */}
            <Stack.Screen 
              name="CadastroFace" 
              component={CadastroFace}
              options={{ title: 'Cadastro de Face' }}
            />
            <Stack.Screen 
              name="CadastroQuarteirao" 
              component={CadastroQuarteirao}
              options={{ title: 'Cadastro de Quarteirão' }}
            />
            <Stack.Screen 
              name="CadastroImovel" 
              component={CadastroImovel}
              options={{ title: 'Cadastro de Imóvel' }}
            />
        
            
            {/* TELAS DE PRODUÇÃO */}
            <Stack.Screen 
              name="ProducaoInicio" 
              component={ProducaoInicio}
              options={{ title: 'Iniciar Produção' }}
            />
            <Stack.Screen 
              name="ProducaoControle" 
              component={ProducaoControle}
              options={{ title: 'Controle de Produção' }}
            />
            <Stack.Screen 
              name="ProducaoHistorico" 
              component={ProducaoHistorico}
              options={{ title: 'Histórico de Produção' }}
            />
            
            {/* TELAS DE RELATÓRIOS */}
            <Stack.Screen 
              name="RelatorioGeral" 
              component={RelatorioGeral}
              options={{ title: 'Relatório Geral' }}
            />
            <Stack.Screen 
              name="RelatorioFinanceiro" 
              component={RelatorioFinanceiro}
              options={{ title: 'Relatório Financeiro' }}
            />
            <Stack.Screen 
              name="ExportarDados" 
              component={ExportarDados}
              options={{ title: 'Exportar Dados' }}
            />
            
            {/* TELAS DE MAPAS */}
            <Stack.Screen 
              name="MapaQuarteiroes" 
              component={MapaQuarteiroes}
              options={{ title: 'Mapa de Quarteirões', headerShown: false }}
            />
            <Stack.Screen 
              name="MapaFaces" 
              component={MapaFaces}
              options={{ title: 'Mapa de Faces', headerShown: false }}
            />
            <Stack.Screen 
              name="MapaImoveis" 
              component={MapaImoveis}
              options={{ title: 'Mapa de Imóveis', headerShown: false }}
            />
            <Stack.Screen 
              name="GPS" 
              component={GPS}
              options={{ title: 'GPS Tracking' }}
            />
            
            {/* OUTRAS TELAS */}
            <Stack.Screen 
              name="Configuracoes" 
              component={Configuracoes}
              options={{ title: 'Configurações' }}
            />
            <Stack.Screen 
              name="Ajuda" 
              component={Ajuda}
              options={{ title: 'Ajuda' }}
            />
            <Stack.Screen 
              name="Quarteiroes" 
              component={Quarteiroes}
              options={{ title: 'Quarteirões' }}
            />
            <Stack.Screen 
              name="Faces" 
              component={Faces}
              options={{ title: 'Faces' }}
            />
            <Stack.Screen 
              name="Localidades" 
              component={Localidades}
              options={{ title: 'Localidades' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;