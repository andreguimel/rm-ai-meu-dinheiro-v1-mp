import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
// import { NUMBER_FORMATS, DATE_FORMATS } from "./constants"

// Temporary inline constants
const NUMBER_FORMATS = {
  CURRENCY: {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  PERCENTAGE: {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  },
  DECIMAL: {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
} as const;

const DATE_FORMATS = {
  DISPLAY: "dd/MM/yyyy",
  INPUT: "yyyy-MM-dd",
  DATETIME: "dd/MM/yyyy HH:mm",
  API: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", NUMBER_FORMATS.CURRENCY).format(
    numValue
  );
};

// Parse currency string to number
export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  const cleanValue = value.replace(/[R$\s]/g, "").replace(",", ".");
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
};

// Percentage formatting
export const formatPercentage = (value: number): string => {
  if (isNaN(value)) return "0%";
  return new Intl.NumberFormat("pt-BR", NUMBER_FORMATS.PERCENTAGE).format(
    value / 100
  );
};

// Number formatting
export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions
): string => {
  if (isNaN(value)) return "0";
  return new Intl.NumberFormat(
    "pt-BR",
    options || NUMBER_FORMATS.DECIMAL
  ).format(value);
};

// Date formatting
export const formatDate = (
  date: string | Date,
  formatString: string = DATE_FORMATS.DISPLAY
): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "";
    return format(dateObj, formatString, { locale: ptBR });
  } catch {
    return "";
  }
};

// Relative date formatting
export const formatRelativeDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "";

    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Hoje";
    if (diffInDays === 1) return "Ontem";
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} meses atrás`;
    return `${Math.floor(diffInDays / 365)} anos atrás`;
  } catch {
    return "";
  }
};

// Phone formatting (Brazilian format)
export const formatPhone = (phone: string): string => {
  if (!phone) return "";
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
};

// Apply phone mask as user types
export const applyPhoneMask = (value: string): string => {
  if (!value) return "";

  // Remove all non-numeric characters
  const cleanValue = value.replace(/\D/g, "");

  // Limit to maximum 11 digits
  const limitedValue = cleanValue.slice(0, 11);

  // Apply mask based on length
  if (limitedValue.length <= 2) {
    return `(${limitedValue}`;
  } else if (limitedValue.length <= 7) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
  } else if (limitedValue.length <= 11) {
    const hasNinthDigit = limitedValue.length === 11;
    if (hasNinthDigit) {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(
        2,
        7
      )}-${limitedValue.slice(7, 11)}`;
    } else {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(
        2,
        6
      )}-${limitedValue.slice(6, 10)}`;
    }
  }

  return limitedValue;
};

// Clean phone number (remove formatting)
export const cleanPhone = (phone: string): string => {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
};

// Clean phone and remove the 9th digit if it's a mobile number
// Examples:
// - (11) 9 9999-9999 becomes 1199999999 (removes the 9)
// - (11) 98888-7777 becomes 1188887777 (removes the 9)
// - (11) 3333-4444 stays 1133334444 (landline, no change)
export const cleanPhoneForStorage = (phone: string): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");

  // If it's a mobile number with 11 digits and starts with a valid area code
  // and the 3rd digit is 9, remove the 9
  if (cleaned.length === 11 && cleaned[2] === "9") {
    // Keep area code (first 2 digits) + remove the 9 + keep the rest
    return cleaned.slice(0, 2) + cleaned.slice(3);
  }

  return cleaned;
};

// Format phone for Brazil with country code
export const formatPhoneBrazil = (phone: string): string => {
  // Use cleanPhoneForStorage to ensure proper mobile number format
  const cleaned = cleanPhoneForStorage(phone);
  if (!cleaned) return "";

  // Add +55 if not present and format
  if (cleaned.length === 10) {
    return `+55 ${formatPhone(cleaned)}`;
  } else if (cleaned.length === 13 && cleaned.startsWith("55")) {
    const localNumber = cleaned.slice(2);
    return `+55 ${formatPhone(localNumber)}`;
  }

  return `+55 ${formatPhone(cleaned)}`;
};

// CPF formatting
export const formatCPF = (cpf: string): string => {
  if (!cpf) return "";
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length === 11) {
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
};

// CNPJ formatting
export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return "";
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  if (cleanCNPJ.length === 14) {
    return cleanCNPJ.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }
  return cnpj;
};

// CEP formatting
export const formatCEP = (cep: string): string => {
  if (!cep) return "";
  const cleanCEP = cep.replace(/\D/g, "");

  if (cleanCEP.length === 8) {
    return cleanCEP.replace(/(\d{5})(\d{3})/, "$1-$2");
  }
  return cep;
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// String utilities
export const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  if (!str) return "";
  return str.split(" ").map(capitalize).join(" ");
};

export const truncate = (str: string, length: number = 50): string => {
  if (!str || str.length <= length) return str;
  return str.slice(0, length) + "...";
};

// URL utilities
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as any;
  if (typeof obj === "object") {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Array utilities
export const groupBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const group = key(item);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(
  array: T[],
  key: keyof T | ((item: T) => any),
  direction: "asc" | "desc" = "asc"
): T[] => {
  const getValue = typeof key === "function" ? key : (item: T) => item[key];

  return [...array].sort((a, b) => {
    const aVal = getValue(a);
    const bVal = getValue(b);

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = <T, K>(array: T[], key: (item: T) => K): T[] => {
  const seen = new Set<K>();
  return array.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// Subscription utilities
export const calculateDaysRemaining = (
  endDate: string | Date | null
): number => {
  if (!endDate) return 0;

  try {
    const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
    if (!isValid(end)) return 0;

    const now = new Date();
    const diffInMs = end.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffInDays);
  } catch {
    return 0;
  }
};

export const formatDaysRemaining = (
  days: number,
  isTrialPeriod: boolean = false
): string => {
  if (days <= 0) {
    return isTrialPeriod ? "Trial expirado" : "Expirado";
  }

  if (days === 1) {
    return isTrialPeriod ? "1 dia de trial restante" : "1 dia restante";
  }

  return isTrialPeriod
    ? `${days} dias de trial restantes`
    : `${days} dias restantes`;
};

export const getSubscriptionStatus = (
  isActive: boolean,
  isTrialPeriod: boolean,
  daysRemaining: number
): "active" | "trial" | "expired" | "inactive" => {
  if (!isActive) return "inactive";

  if (isTrialPeriod) {
    return daysRemaining > 0 ? "trial" : "expired";
  }

  return daysRemaining > 0 ? "active" : "expired";
};

export const getSubscriptionBadgeVariant = (
  status: "active" | "trial" | "expired" | "inactive"
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "active":
      return "default";
    case "trial":
      return "secondary";
    case "expired":
    case "inactive":
      return "destructive";
    default:
      return "outline";
  }
};

// User utilities
export const getUserDisplayName = (user: any, profile: any): string => {
  if (profile?.name) return profile.name;
  if (user?.email) return user.email.split("@")[0];
  return "Usuário";
};

export const formatUserBadgeText = (
  userId: string,
  currentUserId: string,
  userName: string
): string => {
  if (userId === currentUserId) {
    return userName === currentUserId ? "Você" : userName;
  }
  return userName;
};
