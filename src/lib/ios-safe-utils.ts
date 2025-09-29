/**
 * Utilitários seguros para iOS Safari
 * Substitui date-fns por formatação nativa do JavaScript
 */

// Detectar se é iPhone/iOS
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Formatação segura de data para iOS
export const formatDateSafe = (dateInput: string | Date, format: 'dd/MM/yyyy' | 'HH:mm' | 'dd/MM/yyyy HH:mm' = 'dd/MM/yyyy'): string => {
  try {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      // Garantir compatibilidade com Safari iOS
      if (dateInput.includes('T')) {
        date = new Date(dateInput);
      } else {
        // Para datas no formato YYYY-MM-DD, adicionar horário para evitar problemas de timezone
        date = new Date(dateInput + 'T00:00:00');
      }
    } else {
      date = dateInput;
    }

    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    switch (format) {
      case 'dd/MM/yyyy':
        return `${day}/${month}/${year}`;
      case 'HH:mm':
        return `${hours}:${minutes}`;
      case 'dd/MM/yyyy HH:mm':
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      default:
        return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.warn('Erro na formatação de data:', error);
    return 'Data inválida';
  }
};

// Formatação de moeda segura para iOS
export const formatCurrencySafe = (value: number): string => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.warn('Erro na formatação de moeda:', error);
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
};

// Formatação de número segura para iOS
export const formatNumberSafe = (value: number): string => {
  try {
    return new Intl.NumberFormat('pt-BR').format(value);
  } catch (error) {
    console.warn('Erro na formatação de número:', error);
    return value.toString().replace('.', ',');
  }
};

// Obter data atual no formato seguro
export const getCurrentDateSafe = (): string => {
  const now = new Date();
  return formatDateSafe(now);
};

// Comparar datas de forma segura
export const compareDatesSafe = (date1: string, date2: string): boolean => {
  try {
    const d1 = new Date(date1.includes('T') ? date1 : date1 + 'T00:00:00');
    const d2 = new Date(date2.includes('T') ? date2 : date2 + 'T00:00:00');
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return false;
    }
    
    return d1.getTime() >= d2.getTime();
  } catch (error) {
    console.warn('Erro na comparação de datas:', error);
    return false;
  }
};

// Obter primeiro dia do mês de forma segura
export const getFirstDayOfMonthSafe = (): string => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return firstDay.toISOString().split('T')[0];
};

// Obter primeiro dia da semana de forma segura
export const getFirstDayOfWeekSafe = (): string => {
  const now = new Date();
  const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
  return firstDay.toISOString().split('T')[0];
};

// Obter primeiro dia do ano de forma segura
export const getFirstDayOfYearSafe = (): string => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  return firstDay.toISOString().split('T')[0];
};

// Formatação de mês por extenso
export const formatMonthSafe = (monthNumber: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  if (monthNumber < 1 || monthNumber > 12) {
    return 'Mês inválido';
  }
  
  return months[monthNumber - 1];
};