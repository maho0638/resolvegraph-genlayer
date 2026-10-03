import { NextResponse } from "next/server";
import {
  serverReadV2Recipe,
  serverV2RecipeContractAddress,
} from "@/lib/server-genlayer";

export const dynamic = "force-dynamic";

function jsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        jsonSafe(item),
      ]),
    );
  }
  return value;
}

export async function GET() {
  try {
    const count = Number(await serverReadV2Recipe("get_recipe_count"));
    const hashes = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        serverReadV2Recipe("get_recipe_hash_by_index", [index]),
      ),
    );
    const recipes = await Promise.all(
      hashes.map((hash) => serverReadV2Recipe("get_recipe", [hash])),
    );

    return NextResponse.json({
      schema: "resolvegraph-recipes-v2",
      network: "studionet",
      contract: serverV2RecipeContractAddress(),
      policyVersion: "RG_V2_IMMUTABLE_RECIPES",
      count,
      hashes: jsonSafe(hashes),
      recipes: jsonSafe(recipes),
      sourceMatch: true,
      proofRun: 37117935627,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "ResolveGraph V2 recipe registry unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}
