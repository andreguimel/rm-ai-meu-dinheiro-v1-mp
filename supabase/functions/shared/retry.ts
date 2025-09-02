// Sistema de retry com exponential backoff
interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export class APIError extends Error {
  constructor(message: string, public status?: number, public response?: any) {
    super(message);
    this.name = "APIError";
  }
}

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    exponentialBase = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Se é o último attempt, throw o erro
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Callback opcional para logging
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      // Calcular delay com exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt),
        maxDelay
      );

      // Adicionar jitter para evitar thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const finalDelay = delay + jitter;

      console.log(
        `[RETRY] Attempt ${attempt + 1}/${
          maxRetries + 1
        } failed, retrying in ${Math.round(finalDelay)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError!;
};

// Helper específico para chamadas do MercadoPago
export const mercadoPagoAPICall = async (
  url: string,
  options: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> => {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);

      // Status codes que devem ser retentados
      const retryableStatuses = [408, 429, 500, 502, 503, 504];

      if (!response.ok && retryableStatuses.includes(response.status)) {
        const errorText = await response.text();
        throw new APIError(
          `MercadoPago API error: ${response.status} - ${errorText}`,
          response.status,
          errorText
        );
      }

      return response;
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      onRetry: (error, attempt) => {
        console.log(
          `[MERCADOPAGO-RETRY] ${url} - Attempt ${attempt}: ${error.message}`
        );
      },
      ...retryOptions,
    }
  );
};

// Wrapper para JSON parsing com retry
export const parseJSONWithRetry = async (response: Response): Promise<any> => {
  return retryWithBackoff(
    async () => {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error(
          `Failed to parse JSON response: ${text.substring(0, 200)}...`
        );
      }
    },
    {
      maxRetries: 2,
      baseDelay: 500,
      onRetry: (error, attempt) => {
        console.log(`[JSON-PARSE-RETRY] Attempt ${attempt}: ${error.message}`);
      },
    }
  );
};
