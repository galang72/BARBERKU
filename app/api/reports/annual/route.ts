import { NextRequest, NextResponse } from "next/server";
import { getAnnualReport } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();
    const data = await getAnnualReport(year);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
