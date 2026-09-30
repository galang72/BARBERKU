import { NextResponse } from "next/server";
import { getDatabaseDiagnostics } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const diag = await getDatabaseDiagnostics();
    return NextResponse.json(diag);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
