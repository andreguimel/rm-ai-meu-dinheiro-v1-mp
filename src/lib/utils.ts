import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatar telefone brasileiro
export function formatPhoneBrazil(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos (celular com DDD)
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  
  // Se tem 10 dígitos (fixo com DDD)
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // Se tem 9 dígitos (celular sem DDD)
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
  }
  
  // Se tem 8 dígitos (fixo sem DDD)
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  // Retorna o valor original se não atender aos padrões
  return phone;
}

// Aplicar máscara durante a digitação
export function applyPhoneMask(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 2) {
    return `(${cleaned}`;
  } else if (cleaned.length <= 3) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3)}`;
  } else if (cleaned.length <= 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  
  // Limita a 11 dígitos
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
}

// Remover formatação para salvar no banco
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
