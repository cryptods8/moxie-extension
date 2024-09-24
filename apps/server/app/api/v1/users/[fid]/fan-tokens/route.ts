import { NextResponse } from "next/server";
import data from "../../../../../../public/moxie_resolve.json";

const query = `
query AllFanTokens($beneficiaries: [String!]!, $symbol: String!) {
  subjectTokens(where: {symbol: $symbol}) {
    portfolio(where: {balance_gt: 0}, first: 1000) {
      balance
      user {
        id                
      }
      
    }
  }
  users(where: { id_in: $beneficiaries }) {
    portfolio(where: {balance_gt: 0}, first: 1000) {
      subjectToken {
        name
        symbol
      }
      balance
    }
  }
}`;

interface SubjectTokenPortfolio {
  balance: string;
  user: {
    id: string;
  };
}

interface FanTokenPortfolio {
  subjectToken: {
    name: string;
    symbol: string;
  };
  balance: string;
}

interface AirstackAllFanTokensResponse {
  data: {
    subjectTokens: {
      portfolio: SubjectTokenPortfolio[];
    }[];
    users: {
      portfolio: FanTokenPortfolio[];
    }[];
  };
}

interface DataItem {
  fid: number;
  address: string;
  profileName: string;
  type: "WALLET_ADDRESS" | "VESTING_ADDRESS";
}

interface SubjectToken {
  balance: string;
  id: string;
}

interface UserFanToken extends SubjectToken {
  fid: number;
  username: string;
  type: "USER";
}

interface ChannelFanToken extends SubjectToken {
  name: string;
  type: "CHANNEL";
}

interface NetworkFanToken extends SubjectToken {
  type: "NETWORK";
}

type FanToken = UserFanToken | ChannelFanToken | NetworkFanToken;

interface Response {
  data: {
    fanTokens: FanToken[];
    fans: UserFanToken[];
  };
}

function getUserData(address: string) {
  const dataItem = (data as DataItem[]).find((r) => r?.address === address);
  if (!dataItem) {
    return null;
  }
  return {
    fid: dataItem.fid,
    username: dataItem.profileName,
  };
}

export async function GET(
  req: Request,
  { params }: { params: { fid: string } }
) {
  const { fid: fidString } = params;
  const fid = parseInt(fidString, 10);

  const apiKey = req.headers.get("x-me-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = `fid:${fid}`;
  const beneficiaries = (data as DataItem[])
    .filter((r) => r?.fid === fid)
    .map((r) => r?.address);
  const res = await fetch(
    "https://api.studio.thegraph.com/query/23537/moxie_protocol_stats_mainnet/version/latest",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { beneficiaries, symbol } }),
    }
  );

  const json = (await res.json()) as AirstackAllFanTokensResponse;
  if (!json.data) {
    return NextResponse.json({ error: "No data" }, { status: 404 });
  }

  const { subjectTokens, users } = json.data;
  const portfolio = subjectTokens.reduce(
    (acc, cur) => [...acc, ...cur.portfolio],
    [] as SubjectTokenPortfolio[]
  );
  const fans = portfolio
    .map((p) => {
      const ud = getUserData(p.user.id);
      if (!ud) {
        return null;
      }
      return {
        ...ud,
        balance: p.balance,
        type: "USER",
      } as UserFanToken;
    })
    .reduce((acc, cur) => {
      if (!cur) {
        return acc;
      }
      const existing = acc.find((t) => t.type === "USER" && t.fid === cur.fid);
      if (!existing) {
        return [...acc, cur];
      }
      existing.balance = (
        BigInt(existing.balance) + BigInt(cur.balance)
      ).toString();
      return acc;
    }, [] as UserFanToken[]);

  const fanTokenPorfolio = users.reduce((acc, cur) => {
    return [...acc, ...cur.portfolio];
  }, [] as FanTokenPortfolio[]);
  const fanTokens = fanTokenPorfolio
    .map((p) => {
      const { symbol } = p.subjectToken;
      const [symbolId, id] = symbol.split(":");
      if (symbolId === "cid") {
        return {
          type: "CHANNEL",
          balance: p.balance,
          id: id!,
          name: p.subjectToken.name,
        } as ChannelFanToken;
      }
      if (symbolId === "fid") {
        return {
          type: "USER",
          balance: p.balance,
          fid: parseInt(id!, 10),
          id: id!,
          username: p.subjectToken.name,
        } as UserFanToken;
      }
      return {
        type: "NETWORK",
        balance: p.balance,
        id: id!,
      } as NetworkFanToken;
    })
    .reduce((acc, cur) => {
      if (!cur) {
        return acc;
      }
      const existing = acc.find((t) => t.type === cur.type && t.id === cur.id);
      if (!existing) {
        return [...acc, cur];
      }
      existing.balance = (
        BigInt(existing.balance) + BigInt(cur.balance)
      ).toString();
      return acc;
    }, [] as FanToken[]);

  const response: Response = {
    data: {
      fanTokens,
      fans,
    },
  };
  return NextResponse.json(response);
}
