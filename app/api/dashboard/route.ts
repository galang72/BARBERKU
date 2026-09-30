import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "today") as any;
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;

    const data = await getDashboardData(filter, start, end);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
