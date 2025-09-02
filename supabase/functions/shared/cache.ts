// Sistema de cache em memória com TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpa entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Instância global do cache
export const subscriptionCache = new MemoryCache();

// TTL padrões
export const CACHE_TTL = {
  SUBSCRIPTION_STATUS: 5 * 60 * 1000, // 5 minutos
  PAYMENT_HISTORY: 10 * 60 * 1000, // 10 minutos
  PREAPPROVAL_SEARCH: 3 * 60 * 1000, // 3 minutos
  USER_VALIDATION: 60 * 1000, // 1 minuto
};

// Helper para criar chaves de cache consistentes
export const getCacheKey = {
  subscription: (userId: string) => `subscription:${userId}`,
  payment: (userId: string) => `payment:${userId}`,
  preapproval: (userId: string) => `preapproval:${userId}`,
  user: (userId: string) => `user:${userId}`,
};

// Cleanup automático a cada 10 minutos
setInterval(() => {
  subscriptionCache.cleanup();
}, 10 * 60 * 1000);
