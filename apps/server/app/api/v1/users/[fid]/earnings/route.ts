import { NextRequest, NextResponse } from "next/server";
import { fetchEarnings } from "../../earnings/fetch-earnings";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { fid: string } }
) {
  const fid = parseInt(params.fid, 10);

  const apiKey = req.headers.get("x-me-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isNaN(fid)) {
    return NextResponse.json(
      { error: "Invalid user identifier: " + fid },
      { status: 400 }
    );
  }

  const earnings = await fetchEarnings(fid);

  return NextResponse.json({ data: earnings });
}
