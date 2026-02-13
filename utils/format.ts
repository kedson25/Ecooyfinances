
export const formatCurrencyInput = (value: string): string => {
  // Remove tudo que não for dígito
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  
  // Converte para centavos
  const amount = parseInt(digits, 10) / 100;
  
  // Formata como moeda brasileira
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parseCurrencyString = (value: string): number => {
  // "1.234,56" -> 1234.56
  const clean = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};
