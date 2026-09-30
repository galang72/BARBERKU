import { NextRequest, NextResponse } from "next/server";
import { getBookings, createBooking, updateBookingStatus } from "@/lib/db";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const DP_AMOUNT = 20000; // DP wajib Rp 20.000

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || undefined;

    // Auto-hangus DP: booking yang CONFIRMED tapi hari ini & belum datang → NO_SHOW
    const bookings = await getBookings(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredIds: string[] = [];
    for (const b of bookings) {
      const bookingDay = new Date(b.bookingDate);
      bookingDay.setHours(0, 0, 0, 0);
      // Jika status masih CONFIRMED/PENDING dan tanggal sudah lewat → NO_SHOW (DP hangus)
      if (
        (b.status === "CONFIRMED" || b.status === "PENDING") &&
        bookingDay < today
      ) {
        expiredIds.push(b.id);
      }
    }

    // Update semua booking expired ke NO_SHOW secara background
    if (expiredIds.length > 0) {
      Promise.allSettled(
        expiredIds.map((id) => updateBookingStatus(id, "NO_SHOW"))
      ).catch(() => {});
    }

    return NextResponse.json(bookings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customerName || !body.barbermanId || !body.serviceId || !body.bookingDate || !body.bookingTime) {
      return NextResponse.json(
        { error: "Lengkapi data booking (Nama, Barberman, Layanan, Tanggal, Jam)" },
        { status: 400 }
      );
    }

    // Validasi DP
    const dpPaid = Number(body.dpPaid || 0);
    if (dpPaid < DP_AMOUNT) {
      return NextResponse.json(
        { error: `DP minimal Rp ${DP_AMOUNT.toLocaleString("id-ID")} wajib dibayar untuk konfirmasi booking` },
        { status: 400 }
      );
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
      dpPaid: DP_AMOUNT,
      dpStatus: "PAID",
    });

    invalidateCache("bookings:");
    return NextResponse.json({
      ...created,
      message: `Booking berhasil! DP Rp ${DP_AMOUNT.toLocaleString("id-ID")} telah diterima. Jika tidak hadir pada hari H, DP hangus.`,
    });
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
    invalidateCache("bookings:");
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
