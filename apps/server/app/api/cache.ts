import { Redis } from "@upstash/redis";

function redis() {
  if (!process.env.REDIS_API_URL || !process.env.REDIS_API_TOKEN) {
    return null;
  }
  const redis = new Redis({
    url: process.env.REDIS_API_URL,
    token: process.env.REDIS_API_TOKEN,
  });
  return redis;
}

export const cache = {
  get: async <V>(key: string): Promise<V | null> => {
    const r = redis();
    if (!r) {
      return Promise.resolve(null);
    }
    const value = await r.get(key);
    return value as V | null;
  },
  set: async <V>(
    key: string,
    value: V,
    customExpiry?: number
  ): Promise<void> => {
    const r = redis();
    if (!r) {
      return;
    }
    // 7-day expiry
    r.setex(key, customExpiry ?? 7 * 24 * 60 * 60, value);
  },
} as const;
