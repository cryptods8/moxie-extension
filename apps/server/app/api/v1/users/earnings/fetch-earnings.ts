import { fetchQuery, init } from "@airstack/node";

export const dynamic = "force-dynamic";

type Timeframe = "TODAY" | "WEEKLY" | "LIFETIME";

interface AirstackEarningStat {
  allEarningsAmount: number;
  castEarningsAmount: number;
  frameDevEarningsAmount: number;
  otherEarningsAmount: number;
}

interface UserEarnings {
  today: AirstackEarningStat;
  weekly: AirstackEarningStat;
  lifetime: AirstackEarningStat;
}

function getEarningsFragment(name: string, timeframe: Timeframe): string {
  return `${name}: FarcasterMoxieEarningStats(
    input: {
      timeframe: ${timeframe}, 
      blockchain: ALL, 
      filter: { 
        entityType: { _eq: USER }, 
        entityId: { _eq: $fid }
      }
    }
  ) {
    FarcasterMoxieEarningStat {
      allEarningsAmount
      castEarningsAmount
      frameDevEarningsAmount
      otherEarningsAmount
    }
  }`;
}

export async function fetchEarnings(fid: number): Promise<UserEarnings | null> {
  if (!process.env.AIRSTACK_API_KEY) {
    throw new Error("AIRSTACK_API_KEY is required");
  }
  init(process.env.AIRSTACK_API_KEY);

  const query = `query GetUserEarnings($fid: String!) {
    ${getEarningsFragment("today", "TODAY")}
    ${getEarningsFragment("weekly", "WEEKLY")}
    ${getEarningsFragment("lifetime", "LIFETIME")}
  }`;
  const { data } = await fetchQuery(query, { fid: fid.toString() });
  if (!data) {
    return null;
  }

  const earnings: UserEarnings = {
    today: data?.today?.FarcasterMoxieEarningStat?.[0] || null,
    weekly: data?.weekly?.FarcasterMoxieEarningStat?.[0] || null,
    lifetime: data?.lifetime?.FarcasterMoxieEarningStat?.[0] || null,
  };
  return earnings;
}
