import { NextRequest, NextResponse } from "next/server";
import { inspectGithubSource } from "@/lib/server-source-adapters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();
  if (!url) {
    return NextResponse.json(
      { error: "url query parameter is required" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await inspectGithubSource(url));
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "GitHub source adapter failed",
        detail: error?.message || "unknown error",
      },
      { status: 400 },
    );
  }
}
