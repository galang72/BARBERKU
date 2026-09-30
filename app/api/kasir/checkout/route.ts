import { NextRequest, NextResponse } from "next/server";
import { processCheckout, CheckoutPayload } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutPayload = await req.json();

    if (!body.customerName || body.customerName.trim() === "") {
      return NextResponse.json({ error: "Nama Customer wajib diisi" }, { status: 400 });
    }

    if (!body.barbermanId) {
      return NextResponse.json({ error: "Silakan pilih Barberman yang bertugas" }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Minimal pilih 1 layanan atau produk" }, { status: 400 });
    }

    if (!body.paymentMethod) {
      return NextResponse.json({ error: "Pilih metode pembayaran" }, { status: 400 });
    }

    const transaction = await processCheckout(body);
    return NextResponse.json({
      success: true,
      transaction,
      message: "Transaksi kasir berhasil disimpan",
    });
  } catch (error: any) {
    console.error("Kasir checkout error:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses transaksi kasir" }, { status: 500 });
  }
}
