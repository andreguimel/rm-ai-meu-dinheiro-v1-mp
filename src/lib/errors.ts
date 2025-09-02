// Error handling constants and utilities
export const ERROR_MESSAGES = {
  // Generic errors
  GENERIC_ERROR: "Ocorreu um erro inesperado. Tente novamente.",
  NETWORK_ERROR: "Erro de conexão. Verifique sua internet.",
  UNAUTHORIZED: "Você não tem permissão para esta ação.",
  FORBIDDEN: "Acesso negado.",
  NOT_FOUND: "Recurso não encontrado.",
  
  // Auth errors
  INVALID_CREDENTIALS: "Email ou senha incorretos.",
  USER_NOT_FOUND: "Usuário não encontrado.",
  EMAIL_ALREADY_EXISTS: "Este email já está em uso.",
  WEAK_PASSWORD: "A senha é muito fraca.",
  
  // Subscription errors
  SUBSCRIPTION_REQUIRED: "Assinatura necessária para acessar este recurso.",
  TRIAL_EXPIRED: "Seu período de teste expirou.",
  PAYMENT_FAILED: "Falha no pagamento. Verifique seus dados.",
  
  // Data errors
  SAVE_ERROR: "Erro ao salvar dados.",
  DELETE_ERROR: "Erro ao excluir item.",
  LOAD_ERROR: "Erro ao carregar dados.",
  UPDATE_ERROR: "Erro ao atualizar dados.",
  
  // Validation errors
  INVALID_DATA: "Dados inválidos fornecidos.",
  REQUIRED_FIELDS: "Campos obrigatórios não preenchidos.",
} as const;

export const ERROR_CODES = {
  // HTTP status codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  
  // Custom error codes
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  TRIAL_EXPIRED: 'TRIAL_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
} as const;

// Error type definitions
export interface AppError {
  code: string | number;
  message: string;
  details?: any;
  timestamp?: Date;
}

// Error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class SubscriptionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Error translation for common Supabase errors
export const translateSupabaseError = (error: any): string => {
  if (!error) return ERROR_MESSAGES.GENERIC_ERROR;
  
  const message = error.message?.toLowerCase() || '';
  
  // Auth errors
  if (message.includes('invalid login credentials')) {
    return ERROR_MESSAGES.INVALID_CREDENTIALS;
  }
  if (message.includes('user not found')) {
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }
  if (message.includes('email already registered')) {
    return ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
  }
  if (message.includes('password should be at least')) {
    return ERROR_MESSAGES.WEAK_PASSWORD;
  }
  
  // Permission errors
  if (message.includes('permission denied') || message.includes('insufficient_privilege')) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  // Default to generic error
  return error.message || ERROR_MESSAGES.GENERIC_ERROR;
};

// Error translation for common MercadoPago errors
export const translateMercadoPagoError = (error: any): string => {
  if (!error) return ERROR_MESSAGES.PAYMENT_FAILED;
  
  const message = error.message?.toLowerCase() || '';
  const status = error.status;
  
  switch (status) {
    case 400:
      return "Dados de pagamento inválidos.";
    case 401:
      return "Erro de autenticação com o MercadoPago.";
    case 404:
      return "Assinatura não encontrada.";
    case 422:
      return "Dados de pagamento não processáveis.";
    default:
      return message || ERROR_MESSAGES.PAYMENT_FAILED;
  }
};

// Generic error handler
export const handleError = (error: any, context?: string): AppError => {
  const timestamp = new Date();
  
  // Log error for debugging
  console.error(`Error in ${context || 'unknown context'}:`, error);
  
  // Handle different error types
  if (error instanceof ValidationError) {
    return {
      code: 'VALIDATION_ERROR',
      message: error.message,
      details: { field: error.field },
      timestamp,
    };
  }
  
  if (error instanceof AuthError) {
    return {
      code: error.code || 'AUTH_ERROR',
      message: error.message,
      timestamp,
    };
  }
  
  if (error instanceof SubscriptionError) {
    return {
      code: error.code || 'SUBSCRIPTION_ERROR',
      message: error.message,
      timestamp,
    };
  }
  
  if (error instanceof NetworkError) {
    return {
      code: error.statusCode || 'NETWORK_ERROR',
      message: error.message,
      timestamp,
    };
  }
  
  // Handle Supabase errors
  if (error?.code || error?.message) {
    return {
      code: error.code || 'SUPABASE_ERROR',
      message: translateSupabaseError(error),
      details: error.details,
      timestamp,
    };
  }
  
  // Generic error fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: ERROR_MESSAGES.GENERIC_ERROR,
    details: error,
    timestamp,
  };
};

// Error boundary helper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error, context);
      throw new Error(appError.message);
    }
  };
};
