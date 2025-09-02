// Sistema de logs estruturados com níveis
declare const Deno: any;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  details?: any;
  userId?: string;
  requestId?: string;
}

class StructuredLogger {
  private currentLevel: LogLevel = LogLevel.INFO;
  private context?: string;

  constructor(context?: string) {
    this.context = context;

    // Configura nível baseado em env var
    try {
      const envLevel = Deno?.env?.get("LOG_LEVEL")?.toUpperCase();
      if (
        envLevel &&
        LogLevel[envLevel as keyof typeof LogLevel] !== undefined
      ) {
        this.currentLevel = LogLevel[envLevel as keyof typeof LogLevel];
      }
    } catch {
      // Se não conseguir acessar Deno.env, usa nível padrão
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatLog(entry: LogEntry): string {
    const levelNames = ["DEBUG", "INFO", "WARN", "ERROR"];
    const levelName = levelNames[entry.level];

    let message = `[${entry.timestamp}] ${levelName}`;

    if (entry.context) {
      message += ` [${entry.context}]`;
    }

    if (entry.requestId) {
      message += ` [${entry.requestId}]`;
    }

    if (entry.userId) {
      message += ` [user:${entry.userId}]`;
    }

    message += ` ${entry.message}`;

    if (entry.details) {
      message += ` - ${JSON.stringify(entry.details)}`;
    }

    return message;
  }

  private log(
    level: LogLevel,
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      details,
      userId,
      requestId,
    };

    const formattedMessage = this.formatLog(entry);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  debug(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): void {
    this.log(LogLevel.DEBUG, message, details, userId, requestId);
  }

  info(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): void {
    this.log(LogLevel.INFO, message, details, userId, requestId);
  }

  warn(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): void {
    this.log(LogLevel.WARN, message, details, userId, requestId);
  }

  error(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): void {
    this.log(LogLevel.ERROR, message, details, userId, requestId);
  }

  // Helper para medir performance
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      this.debug(`Performance: ${label}`, { duration_ms: duration });
    };
  }

  // Helper para logging de requests
  request(
    method: string,
    url: string,
    status?: number,
    duration?: number,
    userId?: string,
    requestId?: string
  ): void {
    const details = { method, url, status, duration_ms: duration };

    if (status && status >= 400) {
      this.warn(`HTTP Request Failed`, details, userId, requestId);
    } else {
      this.info(`HTTP Request`, details, userId, requestId);
    }
  }

  // Factory para criar logger com contexto específico
  child(context: string): StructuredLogger {
    return new StructuredLogger(
      `${this.context || ""}${this.context ? ":" : ""}${context}`
    );
  }
}

// Logger global padrão
export const logger = new StructuredLogger();

// Factory para criar loggers contextuais
export const createLogger = (context: string): StructuredLogger => {
  return new StructuredLogger(context);
};

// Helpers específicos para funções do sistema
export const createFunctionLogger = (functionName: string) => {
  return createLogger(functionName.toUpperCase());
};

// Helper para extrair request ID de headers
export const getRequestId = (req: Request): string => {
  return (
    req.headers.get("x-request-id") ||
    req.headers.get("cf-ray") ||
    crypto.randomUUID().substring(0, 8)
  );
};
