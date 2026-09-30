import { NextRequest, NextResponse } from "next/server";
import { getMembers, createMember, extendMember, deleteMember } from "@/lib/db";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const data = await getMembers(query);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.packageName || !body.durationDays) {
      return NextResponse.json({ error: "Nama, paket, dan durasi member wajib diisi" }, { status: 400 });
    }

    const memberCode = `AD-MBR-${String(Math.floor(100 + Math.random() * 900))}`;
    const endDate = new Date(Date.now() + Number(body.durationDays) * 24 * 60 * 60 * 1000);

    const created = await createMember({
      customerId: body.customerId || null,
      memberCode,
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      packageName: body.packageName,
      endDate,
    });

    invalidateCache("members:");
    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, additionalDays } = body;
    if (!id || !additionalDays) {
      return NextResponse.json({ error: "ID dan tambahan hari wajib diisi" }, { status: 400 });
    }
    const updated = await extendMember(id, Number(additionalDays));
    invalidateCache("members:");
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID member wajib diisi" }, { status: 400 });

    await deleteMember(id);
    invalidateCache("members:");
    return NextResponse.json({ success: true, message: "Member berhasil dihapus" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
