import { NextRequest, NextResponse } from "next/server";
import { fetchCastFromNeynar } from "../../earnings/fetch-cast-from-neynar";
import { fetchQuery } from "@/app/utils/airstack/fetch-query";

interface AirstackFarcasterCast {
  embeds?: {
    url?: string;
  }[];
}

const CastDataQueryFragment = `
{
  embeds
}`;

type HashCastIdentifier = { hash: `0x${string}`; type?: CastType };
type UrlCastIdentifier = { url: string; type: CastType };
type CastIdentifier = HashCastIdentifier | UrlCastIdentifier;

async function fetchCastEmbeds(
  castId: CastIdentifier
): Promise<AirstackFarcasterCast | null> {
  const { type } = castId;

  if ("url" in castId) {
    const embeds = await fetchEmbedsFromWarpcast(castId);
    if (embeds) {
      return { embeds };
    }
  }

  if (!type) {
    const query = `query GetCastEmbeds($hash: String!) {
      FarcasterReplies(input: {filter: { hash: { _eq: $hash}}, blockchain: ALL}) {
        Reply ${CastDataQueryFragment}
      }
      FarcasterCasts(input: {filter: { hash: { _eq: $hash}}, blockchain: ALL}) {
        Cast ${CastDataQueryFragment}
      }
    }`;
    const { data, error } = await fetchQuery(query, { hash: castId.hash });
    if (error) {
      console.log("E", error);
    }

    const replies: AirstackFarcasterCast[] = data.FarcasterReplies?.Reply || [];
    const casts: AirstackFarcasterCast[] = data.FarcasterCasts?.Cast || [];
    return replies[0] ?? casts[0] ?? null;
  } else if (type === "reply") {
    let hash: string | undefined;
    if ("hash" in castId) {
      hash = castId.hash;
    } else {
      const neynarCast = await fetchCastFromNeynar(castId.url);
      if (!neynarCast) {
        console.error("Failed to fetch cast from Neynar", castId.url);
        return null;
      }
      hash = neynarCast.hash;
    }
    const query = `query GetCastEmbeds($hash: String!) {
      FarcasterReplies(input: {filter: { hash: { _eq: $hash}}, blockchain: ALL}) {
        Reply ${CastDataQueryFragment}
      }
    }`;
    const { data, error } = await fetchQuery(query, { hash });
    if (error) {
      console.log("E", error);
    }

    const replies: AirstackFarcasterCast[] = data.FarcasterReplies?.Reply || [];
    return replies[0] ?? null;
  }

  let query: string;
  let variables: Record<string, string>;
  if ("url" in castId) {
    query = `query GetCastEmbeds($castUrl: String!) {
      FarcasterCasts(input: {filter: { url: { _eq: $castUrl}}, blockchain: ALL}) {
        Cast ${CastDataQueryFragment}
      }
    }`;
    variables = { castUrl: castId.url };
  } else {
    query = `query GetCastEmbeds($hash: String!) {
      FarcasterCasts(input: {filter: { hash: { _eq: $hash}}, blockchain: ALL}) {
        Cast ${CastDataQueryFragment}
      }
    }`;
    variables = { hash: castId.hash };
  }
  const { data, error } = await fetchQuery(query, variables);
  if (error) {
    console.log("E", error);
  }

  const casts: AirstackFarcasterCast[] = data?.FarcasterCasts?.Cast || [];
  return casts[0] ?? null;
}

export const dynamic = "force-dynamic";

type CastType = "cast" | "reply";

interface WarpcastCastData {
  result?: {
    casts?: {
      hash: string;
      author: {
        username: string;
      };
      embeds?: {
        urls?: {
          openGraph?: {
            url: string;
          };
        }[];
      };
    }[];
  };
}

async function fetchEmbedsFromWarpcast(castId: CastIdentifier) {
  if ("hash" in castId) {
    return null;
  }
  try {
    const urlParts = castId.url.split("/");
    const username = urlParts[urlParts.length - 2]!;
    const hashPrefix = urlParts[urlParts.length - 1]!;
    const resp = await fetch(
      `https://client.warpcast.com/v2/user-thread-casts?castHashPrefix=${hashPrefix}&username=${username}&limit=1`
    );
    const data: WarpcastCastData = await resp.json();

    const cast = data.result?.casts?.find(
      (c) => c.author.username === username && c.hash.startsWith(hashPrefix)
    );
    const embeds = (cast?.embeds?.urls || [])
      .map((url) => ({
        url: url.openGraph?.url,
      }))
      .filter((e) => !!e.url);
    return embeds;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const castUrl = q.get("castUrl");
  const type = q.get("type") as CastType | undefined;
  const castHash = q.get("castHash");
  const apiKey = req.headers.get("x-me-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let castId: CastIdentifier;
    if (!castUrl && !castHash) {
      return NextResponse.json(
        { error: "Missing castUrl or castHash" },
        { status: 400 }
      );
    }
    if (castHash) {
      castId = { hash: castHash as `0x${string}`, type };
    } else {
      castId = { url: castUrl as string, type: type ?? "cast" };
    }

    const cast = await fetchCastEmbeds(castId);
    if (!cast) {
      return NextResponse.json(
        { error: "Failed to fetch cast" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      data: {
        embeds: cast.embeds || [],
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as any).message }, { status: 500 });
  }
}
