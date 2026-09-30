import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/db";
import { withCache, TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "today") as any;
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;

    const cacheKey = `dashboard:${filter}:${start}:${end}`;
    const data = await withCache(cacheKey, () => getDashboardData(filter, start, end), TTL.DASHBOARD);

    return NextResponse.json(data, {
      headers: { "Cache-Control": `s-maxage=${TTL.DASHBOARD}, stale-while-revalidate=10` },
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
