import { fetchQuery, init } from "@airstack/node";
import { NextRequest, NextResponse } from "next/server";
import { fetchCastFromNeynar } from "./fetch-cast-from-neynar";

type EarnerType = "CHANNEL_FANS" | "CREATOR" | "NETWORK" | "CREATOR_FANS";
interface AirstackFarcasterCast {
  castedBy: {
    userId: string;
    fnames: string[];
    profileImage?: string;
  };
  channel: {
    name: string;
    imageUrl?: string;
  } | null;
  moxieEarningsSplit:
    | {
        earnerType: EarnerType;
        earningsAmount: number;
      }[]
    | null;
}

const CastDataQueryFragment = `
{
  hash
  castedBy {
    userId
    fnames
  }
  channel {
    name
    imageUrl
  }
  moxieEarningsSplit {
    earnerType
    earningsAmount
  }
}`;

async function fetchMoxieEarnings(
  castUrl: string,
  type: CastType
): Promise<AirstackFarcasterCast | null> {
  if (!process.env.AIRSTACK_API_KEY) {
    throw new Error("AIRSTACK_API_KEY is required");
  }
  init(process.env.AIRSTACK_API_KEY);

  if (type === "reply") {
    const neynarCast = await fetchCastFromNeynar(castUrl);
    if (!neynarCast) {
      console.error("Failed to fetch cast from Neynar", castUrl);
      return null;
    }
    const query = `query GetMoxieFanTokenHoldings($hash: String!) {
      FarcasterReplies(input: {filter: { hash: { _eq: $hash}}, blockchain: ALL}) {
        Reply ${CastDataQueryFragment}
      }
    }`;
    const { data, error } = await fetchQuery(query, { hash: neynarCast.hash });
    if (error) {
      console.log("E", error);
    }

    const replies: AirstackFarcasterCast[] = data.FarcasterReplies?.Reply || [];
    return replies[0] ?? null;
  }
  const query = `query GetMoxieFanTokenHoldings($castUrl: String!) {
    FarcasterCasts(input: {filter: { url: { _eq: $castUrl}}, blockchain: ALL}) {
      Cast ${CastDataQueryFragment}
    }
  }`;
  const { data, error } = await fetchQuery(query, { castUrl });
  if (error) {
    console.log("E", error);
  }

  const casts: AirstackFarcasterCast[] = data.FarcasterCasts?.Cast || [];
  return casts[0] ?? null;
}

export const dynamic = "force-dynamic";

type CastType = "cast" | "reply";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const castUrl = q.get("castUrl");
  const type = (q.get("type") as CastType | undefined) ?? "cast";
  const apiKey = req.headers.get("x-me-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!castUrl) {
      return NextResponse.json({ error: "Missing castUrl" }, { status: 400 });
    }

    const cast = await fetchMoxieEarnings(castUrl, type);
    if (!cast) {
      return NextResponse.json(
        { error: "Failed to fetch cast" },
        { status: 404 }
      );
    }
    const earnings = (cast.moxieEarningsSplit || []).reduce(
      (acc, { earnerType, earningsAmount }) => {
        if (earnerType === "CHANNEL_FANS") {
          acc.channelFans += earningsAmount;
        } else if (earnerType === "CREATOR") {
          acc.creator += earningsAmount;
        } else if (earnerType === "NETWORK") {
          acc.network += earningsAmount;
        } else if (earnerType === "CREATOR_FANS") {
          acc.creatorFans += earningsAmount;
        }
        acc.total += earningsAmount;
        return acc;
      },
      { channelFans: 0, creator: 0, network: 0, creatorFans: 0, total: 0 }
    );
    return NextResponse.json({
      data: {
        creator: {
          fid: parseInt(cast.castedBy.userId, 10),
          username: cast.castedBy.fnames[0],
          profileImage: cast.castedBy.profileImage,
        },
        channel: cast.channel?.name
          ? {
              name: cast.channel.name,
              imageUrl: cast.channel.imageUrl,
            }
          : null,
        earnings,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as any).message }, { status: 500 });
  }
}
