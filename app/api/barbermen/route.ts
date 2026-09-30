import { NextRequest, NextResponse } from "next/server";
import { getBarbermen, createBarberman, deleteBarberman, memoryDB, saveLocalDB, initMemoryDBIfNeeded } from "@/lib/db";
import { withCache, invalidateCache, TTL } from "@/lib/cache";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";
    const branchParam = searchParams.get("branch") || undefined;

    // Jika tidak ada branch param eksplisit, cek session
    let effectiveBranch = branchParam;
    if (!effectiveBranch) {
      const session = await getAdminSession();
      if (session && session.branch && session.branch !== "All") {
        // Admin cabang → otomatis filter ke cabangnya
        effectiveBranch = session.branch;
      }
      // Owner (branch === "All" atau null) → tidak filter, lihat semua
    }

    const cacheKey = `barbermen:${includeInactive}:${effectiveBranch || "all"}`;
    const data = await withCache(
      cacheKey,
      () => getBarbermen(includeInactive, effectiveBranch),
      TTL.BARBERMEN
    );

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

    // Set branch dari session jika tidak diisi
    if (!body.branch) {
      const session = await getAdminSession();
      if (session?.branch && session.branch !== "All") {
        body.branch = session.branch;
      } else {
        body.branch = "Telkom"; // default
      }
    }

    const created = await createBarberman(body);
    invalidateCache("barbermen:");
    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rawData } = body;
    if (!id) {
      return NextResponse.json({ error: "ID barberman wajib diisi" }, { status: 400 });
    }

    // Hanya kirim field yang valid ke Prisma
    const prismaData: Record<string, any> = {};
    if (rawData.name !== undefined)      prismaData.name = rawData.name;
    if (rawData.nickname !== undefined)  prismaData.nickname = rawData.nickname;
    if (rawData.phone !== undefined)     prismaData.phone = rawData.phone;
    if (rawData.isActive !== undefined)  prismaData.isActive = rawData.isActive;
    if (rawData.branch !== undefined)    prismaData.branch = rawData.branch;
    if (rawData.photoUrl !== undefined)  prismaData.photoUrl = rawData.photoUrl;

    let updated: any = null;

    // Coba update ke Prisma/Supabase
    try {
      updated = await prisma.barberman.update({
        where: { id },
        data: prismaData,
      });
    } catch (prismaErr: any) {
      console.warn("⚠️ Prisma update barberman gagal, fallback ke memoryDB:", prismaErr?.message);
    }

    // Selalu update memoryDB juga
    await initMemoryDBIfNeeded();
    const idx = memoryDB.barbermen.findIndex((b: any) => b.id === id);
    if (idx !== -1) {
      memoryDB.barbermen[idx] = { ...memoryDB.barbermen[idx], ...rawData };
      saveLocalDB();
      if (!updated) updated = memoryDB.barbermen[idx];
    }

    invalidateCache("barbermen:");
    return NextResponse.json(updated || { id, ...rawData, success: true });
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
    invalidateCache("barbermen:");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
