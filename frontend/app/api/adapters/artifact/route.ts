import { NextRequest, NextResponse } from "next/server";
import { inspectPublicArtifact } from "@/lib/server-evidence";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();
  const sha256 = request.nextUrl.searchParams.get("sha256")?.trim();

  if (!url) {
    return NextResponse.json(
      { error: "url query parameter is required" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await inspectPublicArtifact(url, sha256));
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Artifact source adapter failed",
        detail: error?.message || "unknown error",
      },
      { status: 400 },
    );
  }
}
