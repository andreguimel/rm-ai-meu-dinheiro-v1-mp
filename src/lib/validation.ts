// Validation constants and helpers
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELDS: "Por favor, preencha todos os campos obrigatórios.",
  INVALID_EMAIL: "Por favor, insira um email válido.",
  INVALID_PASSWORD: "A senha deve ter pelo menos 6 caracteres.",
  PASSWORD_MISMATCH: "As senhas não coincidem.",
  INVALID_PHONE: "Por favor, insira um telefone válido.",
  INVALID_PRICE: "Por favor, insira um preço válido.",
  INVALID_NUMBER: "Por favor, insira um número válido.",
  INVALID_DATE: "Por favor, insira uma data válida.",
  INVALID_YEAR: "Por favor, insira um ano válido.",
  MIN_LENGTH: (field: string, min: number) =>
    `${field} deve ter pelo menos ${min} caracteres.`,
  MAX_LENGTH: (field: string, max: number) =>
    `${field} deve ter no máximo ${max} caracteres.`,
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  PHONE_MIN_LENGTH: 10,
  CURRENT_YEAR: new Date().getFullYear(),
  MIN_YEAR: 1900,
  MAX_YEAR: new Date().getFullYear() + 10,
} as const;

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Brazilian format)
export const isValidPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length >= VALIDATION_RULES.PHONE_MIN_LENGTH;
};

// Password validation
export const isValidPassword = (password: string): boolean => {
  return password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;
};

// Generic required field validation
export const isRequiredFieldValid = (
  value: string | number | null | undefined
): boolean => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

// Number validation
export const isValidNumber = (
  value: string | number,
  min?: number,
  max?: number
): boolean => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};

// Year validation
export const isValidYear = (year: string | number): boolean => {
  return isValidNumber(
    year,
    VALIDATION_RULES.MIN_YEAR,
    VALIDATION_RULES.MAX_YEAR
  );
};

// Price validation (accepts string with currency symbols)
export const isValidPrice = (price: string): boolean => {
  const cleanPrice = price.replace(/[R$\s]/g, "").replace(",", ".");
  return isValidNumber(cleanPrice, 0);
};

// Date validation
export const isValidDate = (date: string): boolean => {
  if (!date) return false;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

// Form validation helper
export const validateForm = (
  fields: Record<string, any>,
  rules: Record<string, (value: any) => boolean | string>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  for (const [fieldName, validator] of Object.entries(rules)) {
    const fieldValue = fields[fieldName];
    const result = validator(fieldValue);

    if (typeof result === "string") {
      errors[fieldName] = result;
    } else if (!result) {
      errors[fieldName] = VALIDATION_MESSAGES.REQUIRED_FIELDS;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
