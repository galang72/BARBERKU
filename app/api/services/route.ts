import { NextRequest, NextResponse } from "next/server";
import { getServices, createService, updateService, deleteService } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";
    const data = await getServices(includeInactive);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.price) {
      return NextResponse.json({ error: "Nama dan harga layanan wajib diisi" }, { status: 400 });
    }
    const created = await createService({
      name: body.name,
      category: body.category || "HAIRCUT",
      price: Number(body.price),
      durationMinutes: Number(body.durationMinutes || 30),
      isActive: true,
    });
    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const updated = await updateService(body.id, {
      ...body,
      price: body.price ? Number(body.price) : undefined,
      durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : undefined,
    });
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
    await deleteService(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
