import { NextRequest, NextResponse } from "next/server";
import { getBarbermen, createBarberman, updateBarberman, deleteBarberman } from "@/lib/db";
import { withCache, invalidateCache, TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";
    const branch = searchParams.get("branch") || undefined;
    const cacheKey = `barbermen:${includeInactive}:${branch || "all"}`;
    const data = await withCache(cacheKey, () => getBarbermen(includeInactive, branch), TTL.BARBERMEN);

    return NextResponse.json(data, {
      headers: { "Cache-Control": `s-maxage=${TTL.BARBERMEN}, stale-while-revalidate=15` },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "Nama barberman wajib diisi" }, { status: 400 });
    }
    const created = await createBarberman(body);
    // Invalidate cache agar data terbaru tampil
    invalidateCache("barbermen:");
    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID barberman wajib diisi" }, { status: 400 });
    }
    const updated = await updateBarberman(body.id, body);
    // Invalidate cache agar toggle aktif/nonaktif langsung terlihat
    invalidateCache("barbermen:");
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await deleteBarberman(id);
    // Invalidate cache setelah hapus
    invalidateCache("barbermen:");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
