import { createClient } from "redis";

async function getClient() {
  if (!process.env.REDIS_CONNECTION_STRING) {
    console.error("No Redis connection string");
  }
  const client = await createClient({
    url: process.env.REDIS_CONNECTION_STRING,
  })
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();
  return client;
}

export const cache = {
  get: async <V>(key: string): Promise<V | null> => {
    const r = await getClient();
    if (!r) {
      console.error("No Redis connection");
      return Promise.resolve(null);
    }
    try {
      const value = await r.get(key);
      return value ? (JSON.parse(value) as V) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  set: async <V>(
    key: string,
    value: V,
    customExpiry?: number
  ): Promise<void> => {
    const r = await getClient();
    if (!r) {
      console.error("No Redis connection");
      return;
    }
    try {
      // 7-day expiry
      await r.setEx(
        key,
        customExpiry ?? 7 * 24 * 60 * 60,
        JSON.stringify(value)
      );
    } catch (e) {
      console.error(e);
    }
  },
} as const;
