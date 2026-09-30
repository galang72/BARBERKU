"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Receipt,
  TrendingUp,
  Calendar,
  CreditCard,
  Package,
  AlertTriangle,
  ShoppingBag,
  Wallet,
  CalendarRange,
  ArrowUpRight,
  Printer,
  FileSpreadsheet,
  Scissors,
  CheckCircle,
  ArrowLeftRight,
  Building2,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";

export default function DashboardPage() {
  const [filter, setFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard?filter=${filter}`;
      if (filter === "custom" && customStart && customEnd) {
        url += `&start=${customStart}&end=${customEnd}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, [filter]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchDashboard();
    }
  };

  const metrics = data?.metrics || {
    todayCustomer: 0,
    todayTransaction: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    todayBooking: 0,
    totalMember: 0,
    totalProduct: 0,
    lowStockProducts: 0,
    productSalesRevenue: 0,
    cashInHand: 0,
  };

  const barberPerformance = data?.barberPerformance || [];

  const handleExportExcel = () => {
    const formatted = barberPerformance.map((b: any) => ({
      "Nama Barberman": b.name,
      "Jumlah Customer": b.customers,
      "Jumlah Transaksi": b.transactions,
      "Total Omzet": b.omzet,
    }));
    exportToExcel(formatted, `Performa_Barberman_${filter}`);
  };

  const handleExportCSV = () => {
    const formatted = barberPerformance.map((b: any) => ({
      "Nama Barberman": b.name,
      "Jumlah Customer": b.customers,
      "Jumlah Transaksi": b.transactions,
      "Total Omzet": b.omzet,
    }));
    exportToCSV(formatted, `Performa_Barberman_${filter}`);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {user?.role === "OWNER"
                  ? "Akses Owner (Pusat & Semua Cabang)"
                  : user?.role === "ADMIN_TELKOM"
                  ? "Panel Cabang Telkom"
                  : user?.role === "ADMIN_SUTA"
                  ? "Panel Cabang Suta"
                  : "Panel Operasional"}
              </span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>DASHBOARD OPERASIONAL</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan performa penjualan kasir, stok produk, dan produktivitas barberman AD Barbershop.
          </p>
        </div>

        {/* DATE FILTER BUTTONS */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {[
            { id: "today", label: "Hari Ini" },
            { id: "yesterday", label: "Kemarin" },
            { id: "week", label: "Minggu Ini" },
            { id: "month", label: "Bulan Ini" },
            { id: "year", label: "Tahun Ini" },
            { id: "custom", label: "Custom" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === item.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOM DATE RANGE PICKER (IF CUSTOM SELECTED) */}
      {filter === "custom" && (
        <form
          onSubmit={handleApplyCustom}
          className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs shadow-sm"
        >
          <span className="text-slate-700 font-bold">Rentang Tanggal:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
            required
          />
          <span className="text-slate-400">s/d</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
            required
          />
          <Button type="submit" size="sm" variant="primary">
            Terapkan Filter
          </Button>
        </form>
      )}

      {/* TOP 10 METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Customer Hari Ini */}
        <Card className="hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Customer</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.todayCustomer}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total tamu dilayani</div>
        </Card>

        {/* Card 2: Transaksi Hari Ini */}
        <Card className="hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Transaksi</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.todayTransaction}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Struk tercetak</div>
        </Card>

        {/* Card 3: Omzet Hari Ini */}
        <Card className="border-blue-200 bg-blue-50/60 hover:border-blue-400">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
            <span>Omzet Terpilih</span>
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700">
            {formatRupiah(metrics.todayRevenue)}
          </div>
          <div className="text-[11px] text-blue-600/80 font-medium mt-1">Layanan + Produk</div>
        </Card>

        {/* Card 4: Omzet Bulan Ini */}
        <Card className="hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Omzet Bulan Ini</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {formatRupiah(metrics.monthRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Akumulasi bulan berjalan</div>
        </Card>

        {/* Card 5: Cash di Pegang */}
        <Card className="border-emerald-200 bg-emerald-50/40 hover:border-emerald-300">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Cash Saat Ini</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {formatRupiah(metrics.cashInHand)}
          </div>
          <div className="text-[11px] text-emerald-600/80 font-medium mt-1">Uang fisik laci kasir</div>
        </Card>

        {/* Card 6: Booking Hari Ini */}
        <Card className="hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Booking Hari Ini</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <CalendarRange className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.todayBooking}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Jadwal reservasi</div>
        </Card>

        {/* Card 7: Total Member */}
        <Card className="hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Member</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalMember}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Member loyal aktif</div>
        </Card>

        {/* Card 8: Total Produk */}
        <Card className="hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Produk</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalProduct}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Item katalog aktif</div>
        </Card>

        {/* Card 9: Produk Hampir Habis */}
        <Card
          className={`transition ${
            metrics.lowStockProducts > 0
              ? "border-rose-300 bg-rose-50/50"
              : "hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className={metrics.lowStockProducts > 0 ? "text-rose-700 font-bold" : ""}>
              Hampir Habis
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {metrics.lowStockProducts}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Perlu restock segera</div>
        </Card>

        {/* Card 10: Penjualan Produk */}
        <Card className="hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Penjualan Produk</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {formatRupiah(metrics.productSalesRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Omzet pomade/tonic/dll</div>
        </Card>
      </div>

      {/* SECTION: PERFORMA BARBERMAN */}
      <Card className="border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-blue-600" />
              <span>PERFORMA BARBERMAN ({filter.toUpperCase()})</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Data dihitung otomatis dari transaksi database aktual berdasarkan barberman yang melayani customer.
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={handleExportExcel} variant="secondary" size="sm">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Excel
            </Button>
            <Button onClick={handleExportCSV} variant="secondary" size="sm">
              CSV
            </Button>
            <Button onClick={() => window.print()} variant="secondary" size="sm">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print
            </Button>
          </div>
        </div>

        {/* BARBERMAN TABLE */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Barberman</th>
                <th className="py-3 px-4 text-center">Customer</th>
                <th className="py-3 px-4 text-center">Transaksi</th>
                <th className="py-3 px-4 text-right">Omzet</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {barberPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                barberPerformance.map((b: any, index: number) => (
                  <tr
                    key={b.id || index}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-extrabold text-sm shadow-sm">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold">{b.name}</div>
                        <div className="text-xs text-slate-400">Stylist Professional</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                        {b.customers} orang
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                        {b.transactions}x
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-700 text-base">
                      {formatRupiah(b.omzet)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="green">Aktif Bertugas</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* TABLE SUMMARY ROW */}
            {barberPerformance.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-blue-500/30 bg-blue-50/70 font-bold text-sm">
                  <td className="py-3 px-4 text-blue-900">TOTAL OPERASIONAL</td>
                  <td className="py-3 px-4 text-center text-blue-900">
                    {barberPerformance.reduce((acc: number, b: any) => acc + b.customers, 0)} orang
                  </td>
                  <td className="py-3 px-4 text-center text-blue-900">
                    {barberPerformance.reduce((acc: number, b: any) => acc + b.transactions, 0)}x
                  </td>
                  <td className="py-3 px-4 text-right text-blue-800 text-base font-black">
                    {formatRupiah(
                      barberPerformance.reduce((acc: number, b: any) => acc + b.omzet, 0)
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 text-xs">
                    Akumulasi
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* QUICK SHORTCUTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kasir POS */}
        <Link
          href="/kasir"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 font-bold">
              <Receipt className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-4">Kasir POS Cepat</h3>
          <p className="text-xs text-slate-500 mt-1">
            Mulai transaksi kasir baru, pilih layanan potong & pomade, cetak struk pembayaran.
          </p>
        </Link>

        {/* Transfer Produk */}
        <Link
          href="/transfer"
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border border-blue-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-600 text-white font-bold">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-4">Transfer Produk</h3>
          <p className="text-xs text-slate-500 mt-1">
            Kirim dan pindahkan stok produk antara Cabang Telkom dan Cabang Suta.
          </p>
        </Link>

        {/* Booking Kalender */}
        <Link
          href="/booking"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 font-bold">
              <CalendarRange className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-4">Jadwal & Booking</h3>
          <p className="text-xs text-slate-500 mt-1">
            Lihat daftar antrean hari ini, konfirmasi reservasi, dan alihkan ke kasir langsung.
          </p>
        </Link>

        {/* Laporan Lengkap */}
        <Link
          href="/laporan/harian"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-4">Laporan Keuangan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Rekap omzet harian, laba pomade, mutasi kas, dan performa tahunan.
          </p>
        </Link>
      </div>
    </div>
  );
}
