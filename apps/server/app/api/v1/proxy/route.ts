import { NextRequest, NextResponse } from "next/server";

const handleRequest = async (req: NextRequest) => {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }
    const apiKey = req.headers.get("x-me-api-key");

    if (apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = ["PUT", "POST", "PATCH", "DELETE"].includes(req.method)
      ? await req.text()
      : undefined;
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
    const responseBody = await response.json();
    return NextResponse.json(responseBody);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
};

export const POST = handleRequest;
export const GET = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;

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
