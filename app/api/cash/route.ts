import { NextRequest, NextResponse } from "next/server";
import { getCashLedger, createCashEntry, updateShopSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCashLedger();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, category, amount, description, source } = body;

    if (!type || !category || !amount || !description) {
      return NextResponse.json({ error: "Lengkapi data kas (Tipe, Kategori, Nominal, Keterangan)" }, { status: 400 });
    }

    const created = await createCashEntry({
      type,
      category,
      amount: Number(amount),
      description,
      source: source || "MANUAL",
    });

    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { initialFloat } = body;
    if (initialFloat === undefined || isNaN(Number(initialFloat))) {
      return NextResponse.json({ error: "Nominal modal kas awal tidak valid" }, { status: 400 });
    }

    const updated = await updateShopSettings({
      initialCashFloat: Number(initialFloat),
    });

    return NextResponse.json({
      success: true,
      initialCashFloat: updated.initialCashFloat,
      message: "Modal kas awal laci berhasil diperbarui!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
