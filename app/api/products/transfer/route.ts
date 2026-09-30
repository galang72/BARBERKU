import { NextRequest, NextResponse } from "next/server";
import { getProductTransfers, createProductTransfer, getProducts } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const transfers = await getProductTransfers();
    const products = await getProducts();
    return NextResponse.json({ transfers, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memuat data transfer" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    const body = await req.json();
    const { productId, fromBranch, toBranch, quantity, notes } = body;

    if (!productId || !fromBranch || !toBranch || !quantity) {
      return NextResponse.json(
        { error: "Data transfer tidak lengkap (Produk, Cabang Asal, Cabang Tujuan, dan Jumlah wajib diisi)" },
        { status: 400 }
      );
    }

    if (fromBranch === toBranch) {
      return NextResponse.json(
        { error: "Cabang asal dan cabang tujuan tidak boleh sama" },
        { status: 400 }
      );
    }

    const createdBy = session?.name || (session?.role === "ADMIN_TELKOM" ? "Admin Telkom" : session?.role === "ADMIN_SUTA" ? "Admin Suta" : "Owner");

    const transfer = await createProductTransfer({
      productId,
      fromBranch,
      toBranch,
      quantity: Number(quantity),
      notes: notes || "",
      createdBy,
    });

    return NextResponse.json({
      success: true,
      message: "Transfer produk berhasil diproses",
      transfer,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memproses transfer produk" }, { status: 500 });
  }
}
