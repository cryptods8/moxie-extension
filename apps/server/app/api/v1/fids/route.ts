import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const handle = q.get("handle");
  const apiKey = req.headers.get("x-dte-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!handle) {
      return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    const resp = await fetch(`https://vasco.wtf/${handle}`, {
      redirect: "manual",
    });
    const location = resp.headers.get("location");
    const fidStr = location?.split("/").pop();
    const fid = fidStr ? parseInt(fidStr, 10) : undefined;
    if (fid == null) {
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
