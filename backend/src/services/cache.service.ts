import NodeCache from 'node-cache';

// TTL: 1 hour default for API responses
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

export function cacheGet<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function cacheSet<T>(key: string, value: T, ttl?: number): void {
  cache.set(key, value, ttl ?? 3600);
}

export function cacheDel(key: string): void {
  cache.del(key);
}

export function cacheFlushClient(clientId: string): void {
  const keys = cache.keys().filter((k) => k.includes(clientId));
  cache.del(keys);
}

export const cacheStats = () => cache.getStats();
