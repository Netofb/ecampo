import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  location: string;
  locationArea: string;
  track: string;
  offline: string;
  input: string;
  placeholder: string;
  shadow: string;
}

interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}
const lightTheme: ThemeColors = {
  background: '#F7F8F5',
  card: '#FFFFFF',
  text: '#1A2B1F',
  textSecondary: '#5B6B5E',
  border: '#DDE1DA',
  primary: '#2E7D32',
  primaryPressed: '#1B5E20',
  onPrimary: '#FFFFFF',
  success: '#2E7D32',
  warning: '#F9A825',
  danger: '#C62828',
  location: '#1565C0',
  locationArea: 'rgba(21, 101, 192, 0.15)',
  track: '#F57C00',
  offline: '#9E9E9E',
  input: '#FFFFFF',
  placeholder: '#5B6B5E',
  shadow: '#000000',
};

const darkTheme: ThemeColors = {
  background: '#10140F',
  card: '#1B211A',
  text: '#EAF0E6',
  textSecondary: '#9BAA96',
  border: '#2C332A',
  primary: '#66BB6A',
  primaryPressed: '#81C784',
  onPrimary: '#10140F',
  success: '#66BB6A',
  warning: '#FFCA28',
  danger: '#E57373',
  location: '#64B5F6',
  locationArea: 'rgba(100, 181, 246, 0.15)',
  track: '#FFB74D',
  offline: '#757575',
  input: '#1B211A',
  placeholder: '#9BAA96',
  shadow: '#000000',
};

const ThemeContext = createContext<Theme>({
  colors: lightTheme,
  isDark: false,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const theme: Theme = {
    colors: isDark ? darkTheme : lightTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
