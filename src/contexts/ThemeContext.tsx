import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  input: string;
  placeholder: string;
  shadow: string;
}

interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}
const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  card: '#F9F9F9',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  primary: '#4CAF50',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  input: '#F9F9F9',
  placeholder: '#8E8E93',
  shadow: '#000000',
};

const darkTheme: ThemeColors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  primary: '#66BB6A',
  success: '#66BB6A',
  warning: '#FFA726',
  danger: '#EF5350',
  input: '#1C1C1E',
  placeholder: '#8E8E93',
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
