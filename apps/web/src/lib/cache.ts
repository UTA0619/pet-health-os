interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    // Periodic cleanup
    if (this.store.size > 1000) this.cleanup();
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

export const cache = new InMemoryCache();

export const CACHE_TTL = {
  HEALTH_SCORE: 24 * 60 * 60 * 1000, // 24h — until next log
  PET_LIST: 5 * 60 * 1000, // 5 min
  BASELINES: 24 * 60 * 60 * 1000, // 24h
  NOTIFICATIONS: 60 * 1000, // 1 min
} as const;
