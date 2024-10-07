import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { body } = await req.json();
  // postUrl is in request params
  const postUrl = req.nextUrl.searchParams.get("postUrl");
  if (!postUrl) {
    return NextResponse.json({ error: "postUrl is required" }, { status: 400 });
  }
  const apiKey = req.headers.get("x-me-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const response = await fetch(postUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const responseBody = await response.json();
  return NextResponse.json(responseBody);
}

// Handle OPTIONS request for preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
