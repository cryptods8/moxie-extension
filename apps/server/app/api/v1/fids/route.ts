import { NextRequest, NextResponse } from "next/server";
import { fetchFid } from "../../fetch-fid";

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

    const fid = await fetchFid(handle);
    if (fid == null) {
      console.error(`Failed to fetch fid for ${handle}`);
      return NextResponse.json(
        { error: "Failed to fetch fid" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: { fid } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as any).message }, { status: 500 });
  }
}
