import { NextRequest, NextResponse } from "next/server";
import { getCustomers, createCustomer } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const customers = await getCustomers(query);
    return NextResponse.json(customers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json({ error: "Nama customer wajib diisi" }, { status: 400 });
    }

    const created = await createCustomer({
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      instagram: body.instagram?.trim() || null,
      address: body.address?.trim() || null,
      notes: body.notes?.trim() || null,
    });

    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
