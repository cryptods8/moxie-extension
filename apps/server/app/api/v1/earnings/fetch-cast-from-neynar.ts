import { cache } from "@/app/api/cache";

interface NeynarCast {
  hash: string;
  text: string;
}
interface NeynarCastResponse {
  cast?: NeynarCast;
}
interface CachedData<T> {
  data: T;
  timestamp: number;
}

export async function fetchCastFromNeynar(
  castUrl: string
): Promise<NeynarCast | null> {
  const cacheKey = `neynarCast/url/${castUrl}`;
  const cachedData = await cache.get<CachedData<NeynarCast>>(cacheKey);
  if (cachedData?.data) {
    return cachedData.data;
  }

  if (!process.env.NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY not set");
  }
  const url = `https://api.neynar.com/v2/farcaster/cast?identifier=${castUrl}&type=url`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      api_key: process.env.NEYNAR_API_KEY,
    },
  };
  const resp = await fetch(url, options);
  if (!resp.ok) {
    console.error(
      `Failed to fetch cast from Neynar: ${resp.status} ${resp.statusText}`
    );
    return null;
  }
  const castResp = (await resp.json()) as NeynarCastResponse;
  if (!castResp.cast) {
    return null;
  }
  const cast = { hash: castResp.cast.hash, text: castResp.cast.text };
  await cache.set<CachedData<NeynarCast>>(cacheKey, {
    data: cast,
    timestamp: Date.now(),
  });

  return cast;
}
