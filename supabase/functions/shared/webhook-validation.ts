// Sistema de validação de webhooks do MercadoPago
declare const Deno: any;

export interface WebhookEvent {
  id: string;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: string;
  user_id: string;
  version: string;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

// Set para rastrear webhooks já processados (idempotência)
const processedWebhooks = new Set<string>();

// TTL para limpar webhooks antigos (24 horas)
const WEBHOOK_TTL = 24 * 60 * 60 * 1000;

// Limpa webhooks antigos periodicamente
const webhookCleanup = () => {
  // Em produção, isso seria melhor implementado com Redis ou banco
  if (processedWebhooks.size > 10000) {
    processedWebhooks.clear();
  }
};

setInterval(webhookCleanup, 60 * 60 * 1000); // A cada hora

/**
 * Valida a assinatura do webhook do MercadoPago
 */
export const validateWebhookSignature = async (
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> => {
  try {
    // Usando Web Crypto API para HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData
    );
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return signature === expectedSignature;
  } catch (error) {
    console.error("[WEBHOOK-VALIDATION] Error validating signature:", error);
    return false;
  }
};

/**
 * Gera ID único para o evento baseado em seus dados
 */
export const generateEventId = async (event: WebhookEvent): Promise<string> => {
  const data = `${event.type}-${event.data.id}-${event.date_created}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 16);
};

/**
 * Verifica se o webhook já foi processado (idempotência)
 */
export const isWebhookProcessed = (eventId: string): boolean => {
  return processedWebhooks.has(eventId);
};

/**
 * Marca webhook como processado
 */
export const markWebhookProcessed = (eventId: string): void => {
  processedWebhooks.add(eventId);
};

/**
 * Valida estrutura básica do webhook
 */
export const validateWebhookStructure = (body: any): body is WebhookEvent => {
  return (
    body &&
    typeof body.id === "string" &&
    typeof body.type === "string" &&
    typeof body.date_created === "string" &&
    body.data &&
    typeof body.data.id === "string"
  );
};

/**
 * Rate limiting simples para webhooks
 */
const webhookRateLimit = new Map<string, number[]>();

export const isRateLimited = (
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
): boolean => {
  const now = Date.now();
  const windowStart = now - windowMs;

  const requests = webhookRateLimit.get(identifier) || [];
  const recentRequests = requests.filter((time) => time > windowStart);

  if (recentRequests.length >= maxRequests) {
    return true;
  }

  recentRequests.push(now);
  webhookRateLimit.set(identifier, recentRequests);

  return false;
};

/**
 * Valida que o webhook é recente (evita replay attacks)
 */
export const isWebhookRecent = (
  dateCreated: string,
  maxAgeMs = 5 * 60 * 1000
): boolean => {
  try {
    const eventTime = new Date(dateCreated).getTime();
    const now = Date.now();

    return now - eventTime <= maxAgeMs;
  } catch {
    return false;
  }
};

/**
 * Wrapper completo para validação de webhook
 */
export interface WebhookValidationResult {
  valid: boolean;
  event?: WebhookEvent;
  eventId?: string;
  error?: string;
}

export const validateWebhook = async (
  payload: string,
  signature?: string,
  secret?: string
): Promise<WebhookValidationResult> => {
  try {
    // Parse do payload
    let event: WebhookEvent;
    try {
      event = JSON.parse(payload);
    } catch {
      return { valid: false, error: "Invalid JSON payload" };
    }

    // Valida estrutura
    if (!validateWebhookStructure(event)) {
      return { valid: false, error: "Invalid webhook structure" };
    }

    // Valida assinatura se fornecida
    if (signature && secret) {
      const isValidSignature = await validateWebhookSignature(
        payload,
        signature,
        secret
      );
      if (!isValidSignature) {
        return { valid: false, error: "Invalid signature" };
      }
    }

    // Valida idade do evento
    if (!isWebhookRecent(event.date_created)) {
      return { valid: false, error: "Event too old" };
    }

    // Gera ID do evento
    const eventId = await generateEventId(event);

    // Verifica idempotência
    if (isWebhookProcessed(eventId)) {
      return { valid: false, error: "Event already processed" };
    }

    // Rate limiting por tipo de evento
    const rateLimitKey = `${event.type}-${event.user_id}`;
    if (isRateLimited(rateLimitKey)) {
      return { valid: false, error: "Rate limit exceeded" };
    }

    return {
      valid: true,
      event,
      eventId,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Validation error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};
