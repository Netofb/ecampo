
export const validateCPF = (cpf: string): string => {
  if (!cpf) return 'CPF é obrigatório';
  
  const cleanedCPF = cpf.replace(/\D/g, '');
  
 
  if (cleanedCPF.length !== 11) return 'CPF deve ter 11 dígitos';
  
 
  const invalidCPFs = [
    '00000000000', '11111111111', '22222222222',
    '33333333333', '44444444444', '55555555555',
    '66666666666', '77777777777', '88888888888',
    '99999999999'
  ];
  
  if (invalidCPFs.includes(cleanedCPF)) return 'CPF inválido';
  
 
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleanedCPF.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;
  
  if (digito1 !== parseInt(cleanedCPF.charAt(9))) return 'CPF inválido';
  
  // Cálculo do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleanedCPF.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;
  
  if (digito2 !== parseInt(cleanedCPF.charAt(10))) return 'CPF inválido';
  
  return '';
};

export const validatePassword = (password: string): string => {
  if (!password) return 'Senha é obrigatória';
  return '';
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return 'Confirme sua senha';
  if (password !== confirmPassword) return 'Senhas diferentes';
  return '';
};

