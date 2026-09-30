"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarRange,
  Plus,
  Clock,
  User,
  Scissors,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  Filter,
  Check,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDateIndo } from "@/lib/utils";

export default function BookingPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Master Data for Booking Form
  const [barbermen, setBarbermen] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Add Booking Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [barbermanId, setBarbermanId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [dpPaid, setDpPaid] = useState(20000); // DP default Rp 20.000
  const [submitting, setSubmitting] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}`);
      const json = await res.json();
      setBookings(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMasters = async () => {
    try {
      const [resB, resS] = await Promise.all([fetch("/api/barbermen"), fetch("/api/services")]);
      const dataB = await resB.json();
      const dataS = await resS.json();
      setBarbermen(dataB);
      if (dataB.length > 0) setBarbermanId(dataB[0].id);
      setServices(dataS);
      if (dataS.length > 0) setServiceId(dataS[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !barbermanId || !serviceId) {
      alert("Harap lengkapi nama customer, barberman, dan layanan");
      return;
    }
    if (dpPaid < 20000) {
      alert("DP minimal Rp 20.000 wajib dibayar untuk konfirmasi booking!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: custName.trim(),
          customerPhone: custPhone.trim() || null,
          barbermanId,
          serviceId,
          bookingDate,
          bookingTime,
          notes,
          dpPaid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal membuat booking");
        return;
      }

      alert(data.message || "✅ Booking berhasil dibuat!");
      setModalOpen(false);
      setCustName("");
      setCustPhone("");
      setNotes("");
      setDpPaid(20000);
      fetchBookings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="blue">Confirmed</Badge>;
      case "ARRIVED":
        return <Badge variant="gold">Arrived (Tiba)</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="purple">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="green">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="red">Cancelled</Badge>;
      case "NO_SHOW":
        return <Badge variant="gray">No Show</Badge>;
      default:
        return <Badge variant="gray">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>KALENDER & JADWAL BOOKING</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen antrean reservasi potong rambut, status kehadiran, dan konversi ke kasir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold shadow-sm"
          />
          <Button onClick={() => setModalOpen(true)} variant="primary" size="sm" className="shadow-md shadow-blue-500/25">
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Booking
          </Button>
        </div>
      </div>

      {/* QUICK STATUS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Total Booking</div>
            <div className="text-xl font-black text-slate-900">{bookings.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <CalendarRange className="w-5 h-5" />
          </div>
        </Card>
        <Card className="p-3.5 border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Tiba / Sedang Potong</div>
            <div className="text-xl font-black text-blue-700">
              {bookings.filter((b) => b.status === "ARRIVED" || b.status === "IN_PROGRESS").length}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Scissors className="w-5 h-5" />
          </div>
        </Card>
        <Card className="p-3.5 border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Selesai (Completed)</div>
            <div className="text-xl font-black text-emerald-600">
              {bookings.filter((b) => b.status === "COMPLETED").length}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </Card>
        <Card className="p-3.5 border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Menunggu (Pending)</div>
            <div className="text-xl font-black text-sky-600">
              {bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED").length}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
            <Clock className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* BOOKING LIST TABLE */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Jam</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Barberman</th>
                <th className="py-3.5 px-4">Layanan</th>
                <th className="py-3.5 px-4">Catatan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi / Alur Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat antrean booking...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada jadwal booking untuk tanggal {formatDateIndo(selectedDate)}.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-black text-blue-700 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>{b.bookingTime}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{b.customerName}</div>
                      {b.customerPhone && (
                        <div className="text-[11px] text-slate-500 font-normal">📞 {b.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-blue-700">
                      💈 {b.barberman?.name || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-800 font-medium">
                      ✂️ {b.service?.name || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 italic">
                      {b.notes || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(b.status)}
                        {b.dpPaid > 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.status === "NO_SHOW"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {b.status === "NO_SHOW" ? "🔥 DP Hangus" : `✅ DP Rp ${(b.dpPaid).toLocaleString("id-ID")}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Status Switcher Dropdown */}
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-blue-600"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="ARRIVED">Arrived</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="NO_SHOW">No Show</option>
                        </select>

                        {/* Direct Kasir shortcut */}
                        {b.status !== "COMPLETED" && b.status !== "CANCELLED" && (
                          <Link
                            href={`/kasir`}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs transition border border-blue-200"
                          >
                            Ke Kasir
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL BUAT BOOKING */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Buat Jadwal Booking Baru"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Customer <span className="text-rose-500 font-bold">* Wajib</span>
            </label>
            <input
              type="text"
              required
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="Contoh: Kevin"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              No. HP / WhatsApp (Opsional)
            </label>
            <input
              type="text"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Barberman
              </label>
              <select
                value={barbermanId}
                onChange={(e) => setBarbermanId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              >
                {barbermen.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Layanan
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Booking
              </label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Booking
              </label>
              <input
                type="time"
                required
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>
          </div>

          {/* DP SECTION */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-amber-600 text-lg">⚠️</span>
              <div>
                <p className="text-xs font-bold text-amber-800">Kebijakan Down Payment (DP)</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  DP <strong>Rp 20.000</strong> wajib dibayar. Jika customer <strong>tidak hadir</strong> pada hari H, DP otomatis <strong>hangus</strong>.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-800 mb-1">
                Jumlah DP Diterima <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-semibold">Rp</span>
                <input
                  type="number"
                  min={20000}
                  step={1000}
                  required
                  value={dpPaid}
                  onChange={(e) => setDpPaid(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              {dpPaid < 20000 && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold">⚠ DP minimal Rp 20.000</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Permintaan Khusus
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Model potongan taper fade, cuci rambut, dll"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            variant="primary"
            className="w-full font-bold shadow-md shadow-blue-500/25"
          >
            {submitting ? "Menyimpan..." : "Konfirmasi Booking"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
