import { NextRequest, NextResponse } from "next/server";
import { getBookings, createBooking, updateBookingStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || undefined;
    const bookings = await getBookings(date);
    return NextResponse.json(bookings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customerName || !body.barbermanId || !body.serviceId || !body.bookingDate || !body.bookingTime) {
      return NextResponse.json({ error: "Lengkapi data booking (Nama, Barberman, Layanan, Tanggal, Jam)" }, { status: 400 });
    }

    const created = await createBooking({
      customerId: body.customerId || null,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone?.trim() || null,
      barbermanId: body.barbermanId,
      serviceId: body.serviceId,
      bookingDate: new Date(body.bookingDate),
      bookingTime: body.bookingTime,
      notes: body.notes || null,
    });

    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "ID dan status wajib diisi" }, { status: 400 });
    }
    const updated = await updateBookingStatus(id, status);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
