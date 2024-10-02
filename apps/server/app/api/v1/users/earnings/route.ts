import { NextRequest, NextResponse } from "next/server";
import { fetchEarnings } from "./fetch-earnings";
import { getFid } from "../user-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const handle = q.get("handle");
  const apiKey = req.headers.get("x-me-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!handle) {
    return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  }

  const fid = getFid(handle);
  if (!fid) {
    return NextResponse.json({ error: "Failed to resolve fid" }, { status: 404 });
  }

  const earnings = await fetchEarnings(fid);

  return NextResponse.json({ data: earnings });
}
