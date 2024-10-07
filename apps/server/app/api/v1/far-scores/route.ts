import { fetchQuery } from "@/app/utils/airstack/fetch-query";
import { NextRequest, NextResponse } from "next/server";

interface AirstackSocial {
  profileName: string;
  socialCapital: {
    socialCapitalRank: number;
    socialCapitalScore: number;
  };
}

async function fetchFarStats(handle: string): Promise<AirstackSocial | null> {
  const query = `query GetSocialCapitalRank($handle: String!) {
    Socials(
      input: {filter: {profileName: {_eq: $handle}, dappName: {_eq: farcaster}}, blockchain: ethereum}
    ) {
      Social {
        profileName
        socialCapital {
          socialCapitalRank
          socialCapitalScore
        }
      }
    }
  }`;
  const { data } = await fetchQuery(query, { handle });

  const socials: AirstackSocial[] = data?.Socials?.Social || [];
  return socials[0] ?? null;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const handle = q.get("handle");
  const apiKey = req.headers.get("x-me-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!handle) {
      return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    const data = await fetchFarStats(handle);
    return NextResponse.json({
      data: data
        ? {
            farScore: data.socialCapital.socialCapitalScore,
            farRank: data.socialCapital.socialCapitalRank,
          }
        : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as any).message }, { status: 500 });
  }
}
