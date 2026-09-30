import { NextRequest, NextResponse } from "next/server";
import { adjustStock } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, type, quantity, reason, notes } = body;

    if (!productId || !type || quantity === undefined || !reason) {
      return NextResponse.json({ error: "Data mutasi stok tidak lengkap" }, { status: 400 });
    }

    const result = await adjustStock(productId, type, Number(quantity), reason, notes);
    return NextResponse.json({
      success: true,
      message: "Stok berhasil disesuaikan",
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
