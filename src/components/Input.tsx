import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  autoComplete?: 'off' | 'password' | 'new-password';
  lowercase?: boolean; // NOVA PROP
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
  autoComplete = 'off',
  lowercase = false, // Valor padrão: false
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const handleChangeText = (text: string) => {
    // Se lowercase for true, converte para minúsculas
    const processedText = lowercase ? text.toLowerCase() : text;
    onChangeText(processedText);
  };

  const shouldShowPasswordToggle = secureTextEntry && value.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={lowercase ? 'none' : autoCapitalize} // Força 'none' se lowercase
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholderTextColor="#999"
          autoCorrect={false} // Recomendado para campos lowercase
          spellCheck={false} // Recomendado para campos lowercase
        />
        {shouldShowPasswordToggle && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeIcon}>{isPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -22 }],
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 5,
  },
});

export default Input;