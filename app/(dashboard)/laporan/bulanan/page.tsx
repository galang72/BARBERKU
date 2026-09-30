"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportHeader } from "@/components/reports/report-header";
import { ReportFooter } from "@/components/reports/report-footer";
import { formatRupiah } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function LaporanBulananPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Gagal mengambil laporan bulanan:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthly();
  }, [selectedYear, selectedMonth]);

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const barberPerformance = data?.barbermanPerformance || [];
  const paymentsBreakdown = data?.paymentsBreakdown || [];
  const topServices = data?.topServices || [];
  const topProducts = data?.topProducts || [];
  const expensesList = data?.expensesList || [];

  const handleExport = (type: "excel" | "csv") => {
    const sheetData = barberPerformance.map((b: any) => ({
      "Bulan": monthLabel,
      "Barberman": b.name,
      "Customer Dilayani": b.customerCount,
      "Jumlah Transaksi": b.transactionCount,
      "Total Omzet": b.omzet,
      "Rata-rata / Customer": b.averagePerCustomer,
      "Kontribusi Omzet (%)": `${b.contributionPercentage}%`,
    }));

    const fileName = `Laporan_Bulanan_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}`;
    if (type === "excel") exportToExcel(sheetData, fileName);
    else exportToCSV(sheetData, fileName);
  };

  return (
    <div className="report-printable space-y-6">
      {/* KOP RESMI CETAK (TERSEMBUNYI DI LAYAR WEB, MUNCUL SAAT PRINT / PDF) */}
      <ReportHeader
        title="LAPORAN OPERASIONAL & KEUANGAN BULANAN"
        subtitle="Analisis Komprehensif: Pendapatan Layanan, Ritel Produk, Laba Bersih, Pengeluaran & Kinerja Tim"
        periodText={monthLabel}
      />

      {/* HEADER WEB & ACTION BUTTONS */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>LAPORAN OPERASIONAL & KEUANGAN BULANAN</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan pembukuan resmi bulanan: omzet, laba kotor, beban operasional, laba bersih, kas laci, dan kontribusi barberman.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PILIH BULAN */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* PILIH TAHUN */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500"
          >
            {[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          <Button onClick={() => handleExport("excel")} variant="outline" size="sm" className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Excel
          </Button>

          <Button
            onClick={() => window.print()}
            variant="primary"
            size="sm"
            className="shadow-md shadow-blue-500/20"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* METRIK UTAMA KEUANGAN BULANAN (6 CARD GRID) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card-stat rounded-xl p-3.5 bg-white border border-blue-200 shadow-sm">
          <div className="text-[11px] text-blue-700 font-bold uppercase tracking-wider">Total Omzet Bruto</div>
          <div className="text-xl font-black text-blue-700 mt-1">
            {formatRupiah(data?.totalOmzet || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Layanan + Produk Ritel</div>
        </div>

        <div className="card-stat rounded-xl p-3.5 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] text-slate-500 font-semibold">Omzet Layanan</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {formatRupiah(data?.serviceSales || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pangkas & Treatment</div>
        </div>

        <div className="card-stat rounded-xl p-3.5 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] text-slate-500 font-semibold">Omzet Ritel Produk</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {formatRupiah(data?.productSales || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pomade, Tonic & Powder</div>
        </div>

        <div className="card-stat rounded-xl p-3.5 bg-rose-50/50 border border-rose-200 shadow-sm">
          <div className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">Pengeluaran Kas</div>
          <div className="text-xl font-black text-rose-700 mt-1">
            -{formatRupiah(data?.cashExpenses || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Beban Operasional Laci</div>
        </div>

        <div className="card-stat rounded-xl p-3.5 bg-emerald-50/50 border border-emerald-200 shadow-sm">
          <div className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Laba Bersih Operasional</div>
          <div className="text-xl font-black text-emerald-700 mt-1">
            {formatRupiah(data?.netOperatingIncome || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Laba Kotor - Beban Kas</div>
        </div>

        <div className="card-stat rounded-xl p-3.5 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] text-slate-500 font-semibold">Saldo Kas Laci</div>
          <div className="text-xl font-black text-emerald-700 mt-1">
            {formatRupiah(data?.cashEnding || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Fisik kas siap pakai</div>
        </div>
      </div>

      {/* METRIK OPERASIONAL TAMU (4 CARD GRID) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-stat rounded-xl p-3 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] text-slate-500">Total Tamu Dilayani</div>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {data?.totalCustomers || 0} orang
          </div>
        </div>

        <div className="card-stat rounded-xl p-3 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] text-slate-500">Total Transaksi Kasir</div>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {data?.totalTransactions || 0} struk
          </div>
        </div>

        <div className="card-stat rounded-xl p-3 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] text-slate-500">Rata-rata Belanja / Tamu</div>
          <div className="text-lg font-black text-blue-700 mt-0.5">
            {formatRupiah(data?.averageTicketSize || 0)}
          </div>
        </div>

        <div className="card-stat rounded-xl p-3 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] text-slate-500">Estimasi Laba Kotor Produk</div>
          <div className="text-lg font-black text-emerald-700 mt-0.5">
            {formatRupiah((data?.productSales || 0) - (data?.productCost || 0))}
          </div>
        </div>
      </div>

      {/* SEKSI 1: RINGKASAN LAPORAN LABA RUGI OPERASIONAL */}
      <div className="space-y-2">
        <h2 className="section-title text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <span>I. Ringkasan Laporan Laba Rugi Operasional ({monthLabel})</span>
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold">
                <th className="py-2.5 px-4">Pos Akun Pembukuan</th>
                <th className="py-2.5 px-4 text-center">Frekuensi / Qty</th>
                <th className="py-2.5 px-4 text-right">Nominal (Rp)</th>
                <th className="py-2.5 px-4 text-right">% Rasio Terhadap Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-4 font-bold text-slate-900">1. Pendapatan Layanan Barbershop (Haircut, Shave & Treatment)</td>
                <td className="py-2.5 px-4 text-center text-slate-600">{data?.totalCustomers || 0} layanan</td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatRupiah(data?.serviceSales || 0)}</td>
                <td className="py-2.5 px-4 text-right text-slate-600">
                  {data?.totalOmzet > 0 ? ((data.serviceSales / data.totalOmzet) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-slate-900">2. Pendapatan Retail Produk Grooming (Pomade, Tonic & Powder)</td>
                <td className="py-2.5 px-4 text-center text-slate-600">
                  {topProducts.reduce((s: number, p: any) => s + (p.count || 0), 0)} unit
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatRupiah(data?.productSales || 0)}</td>
                <td className="py-2.5 px-4 text-right text-slate-600">
                  {data?.totalOmzet > 0 ? ((data.productSales / data.totalOmzet) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="bg-blue-50/60 font-black text-blue-900 border-t border-b border-blue-200">
                <td className="py-2.5 px-4 uppercase">TOTAL PENDAPATAN KOTOR (OMZET BULANAN)</td>
                <td className="py-2.5 px-4 text-center">{data?.totalTransactions || 0} transaksi</td>
                <td className="py-2.5 px-4 text-right text-sm text-blue-700">{formatRupiah(data?.totalOmzet || 0)}</td>
                <td className="py-2.5 px-4 text-right">100.0%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-slate-600 italic pl-8">Dikurangi: Harga Pokok Penjualan (HPP Modal Produk)</td>
                <td className="py-2.5 px-4 text-center text-slate-400">-</td>
                <td className="py-2.5 px-4 text-right text-slate-600">-{formatRupiah(data?.productCost || 0)}</td>
                <td className="py-2.5 px-4 text-right text-slate-400">
                  {data?.totalOmzet > 0 ? ((data.productCost / data.totalOmzet) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-900">
                <td className="py-2.5 px-4">LABA KOTOR OPERASIONAL (GROSS PROFIT)</td>
                <td className="py-2.5 px-4 text-center text-slate-400">-</td>
                <td className="py-2.5 px-4 text-right text-blue-700">{formatRupiah(data?.grossProfit || 0)}</td>
                <td className="py-2.5 px-4 text-right">
                  {data?.totalOmzet > 0 ? ((data.grossProfit / data.totalOmzet) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-rose-600 italic pl-8">Dikurangi: Total Beban Pengeluaran Kas (Beban Operasional Toko)</td>
                <td className="py-2.5 px-4 text-center text-slate-400">{expensesList.length} pos</td>
                <td className="py-2.5 px-4 text-right text-rose-600 font-bold">-{formatRupiah(data?.cashExpenses || 0)}</td>
                <td className="py-2.5 px-4 text-right text-slate-400">
                  {data?.totalOmzet > 0 ? ((data.cashExpenses / data.totalOmzet) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="bg-emerald-50/70 font-black text-emerald-900 border-t-2 border-emerald-300 text-sm">
                <td className="py-3 px-4 uppercase">ESTIMASI LABA BERSIH OPERASIONAL (NET PROFIT)</td>
                <td className="py-3 px-4 text-center text-xs text-slate-500">-</td>
                <td className="py-3 px-4 text-right text-emerald-700">{formatRupiah(data?.netOperatingIncome || 0)}</td>
                <td className="py-3 px-4 text-right text-emerald-700">
                  {data?.totalOmzet > 0 ? ((data.netOperatingIncome / data.totalOmzet) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SEKSI 2 & 3: METODE PEMBAYARAN & EVALUASI TIM BARBERMAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* TABEL METODE PEMBAYARAN */}
        <div className="lg:col-span-5 space-y-2">
          <h2 className="section-title text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span>II. Distribusi Metode Pembayaran</span>
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="py-2.5 px-3">Metode Bayar</th>
                  <th className="py-2.5 px-3 text-center">Transaksi</th>
                  <th className="py-2.5 px-3 text-right">Total (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentsBreakdown.map((pm: any, idx: number) => (
                  <tr key={idx} className="hover:bg-blue-50/40">
                    <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 no-print"></span>
                      <span>{pm.method}</span>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600">{pm.transactionCount}x</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRupiah(pm.totalAmount)}</td>
                    <td className="py-2 px-3 text-right text-slate-500">{pm.percentage}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-black text-slate-900">
                  <td className="py-2 px-3 text-blue-700">TOTAL PEMBAYARAN</td>
                  <td className="py-2 px-3 text-center">{data?.totalTransactions || 0}x</td>
                  <td className="py-2 px-3 text-right text-blue-700">{formatRupiah(data?.totalOmzet || 0)}</td>
                  <td className="py-2 px-3 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* TABEL EVALUASI KINERJA TIM BARBERMAN */}
        <div className="lg:col-span-7 space-y-2">
          <h2 className="section-title text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span>III. Evaluasi Kinerja Tim Barberman ({monthLabel})</span>
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="py-2.5 px-3">Barberman</th>
                  <th className="py-2.5 px-3 text-center">Customer</th>
                  <th className="py-2.5 px-3 text-center">Transaksi</th>
                  <th className="py-2.5 px-3 text-right">Kontribusi Omzet</th>
                  <th className="py-2.5 px-3 text-right">Rata-rata</th>
                  <th className="py-2.5 px-3 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {barberPerformance.map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-blue-50/40">
                    <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-[10px] no-print">
                        {b.name.charAt(0)}
                      </span>
                      <span>{b.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{b.customerCount} orang</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{b.transactionCount}x</td>
                    <td className="py-2.5 px-3 text-right font-black text-blue-700">{formatRupiah(b.omzet)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatRupiah(b.averagePerCustomer)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{b.contributionPercentage}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-black text-slate-900">
                  <td className="py-2.5 px-3 text-blue-700">TOTAL TIM</td>
                  <td className="py-2.5 px-3 text-center">{data?.totalCustomers || 0} orang</td>
                  <td className="py-2.5 px-3 text-center">{data?.totalTransactions || 0}x</td>
                  <td className="py-2.5 px-3 text-right text-blue-700">{formatRupiah(data?.totalOmzet || 0)}</td>
                  <td className="py-2.5 px-3 text-right">{formatRupiah(data?.averageTicketSize || 0)}</td>
                  <td className="py-2.5 px-3 text-right">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* SEKSI 4: RINCIAN PENJUALAN LAYANAN & RETAIL PRODUK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LAYANAN TERLARIS */}
        <div className="space-y-2">
          <h2 className="section-title text-sm font-black uppercase tracking-wider text-slate-900">
            IV. Rincian Penjualan Layanan Haircut & Treatment
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="py-2.5 px-3">Nama Layanan</th>
                  <th className="py-2.5 px-3 text-center">Dilayani</th>
                  <th className="py-2.5 px-3 text-right">Total Omzet</th>
                  <th className="py-2.5 px-3 text-right">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topServices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">Belum ada layanan tercatat.</td>
                  </tr>
                ) : (
                  topServices.map((s: any, idx: number) => (
                    <tr key={idx} className="hover:bg-blue-50/40">
                      <td className="py-2 px-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-2 px-3 text-center text-slate-600">{s.count}x</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRupiah(s.omzet)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {data?.serviceSales > 0 ? ((s.omzet / data.serviceSales) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-black text-slate-900">
                  <td className="py-2 px-3 text-blue-700">SUBTOTAL LAYANAN</td>
                  <td className="py-2 px-3 text-center">{data?.totalCustomers || 0}x</td>
                  <td className="py-2 px-3 text-right text-blue-700">{formatRupiah(data?.serviceSales || 0)}</td>
                  <td className="py-2 px-3 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* PRODUK RETAIL TERLARIS */}
        <div className="space-y-2">
          <h2 className="section-title text-sm font-black uppercase tracking-wider text-slate-900">
            V. Rincian Penjualan Retail Produk (Pomade, Tonic & Powder)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="py-2.5 px-3">Produk Retail</th>
                  <th className="py-2.5 px-3 text-center">Terjual</th>
                  <th className="py-2.5 px-3 text-right">Omzet</th>
                  <th className="py-2.5 px-3 text-right">Laba Kotor</th>
                  <th className="py-2.5 px-3 text-center">Sisa Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">Belum ada penjualan ritel tercatat.</td>
                  </tr>
                ) : (
                  topProducts.map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-blue-50/40">
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800">{p.count} unit</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRupiah(p.omzet)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatRupiah(p.profit)}</td>
                      <td className="py-2 px-3 text-center font-bold text-blue-700">{p.stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-black text-slate-900">
                  <td className="py-2 px-3 text-blue-700">SUBTOTAL RETAIL PRODUK</td>
                  <td className="py-2 px-3 text-center">
                    {topProducts.reduce((s: number, p: any) => s + (p.count || 0), 0)} unit
                  </td>
                  <td className="py-2 px-3 text-right text-blue-700">{formatRupiah(data?.productSales || 0)}</td>
                  <td className="py-2 px-3 text-right text-emerald-700">
                    {formatRupiah((data?.productSales || 0) - (data?.productCost || 0))}
                  </td>
                  <td className="py-2 px-3 text-center text-slate-400">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* SEKSI 5: DAFTAR PENGELUARAN KAS KECIL OPERASIONAL */}
      <div className="space-y-2">
        <h2 className="section-title text-sm font-black uppercase tracking-wider text-slate-900">
          VI. Rekapitulasi Beban Pengeluaran Kas Operasional ({monthLabel})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold">
                <th className="py-2.5 px-4">Waktu & Tanggal</th>
                <th className="py-2.5 px-4">Kategori Beban</th>
                <th className="py-2.5 px-4">Keterangan / Keperluan Operasional</th>
                <th className="py-2.5 px-4 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expensesList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Tidak ada catatan pengeluaran kas pada bulan ini.
                  </td>
                </tr>
              ) : (
                expensesList.map((exp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-blue-50/40">
                    <td className="py-2 px-4 text-slate-500 font-mono text-[11px]">{exp.date}</td>
                    <td className="py-2 px-4 text-blue-700 font-semibold">{exp.category}</td>
                    <td className="py-2 px-4 text-slate-800">{exp.description}</td>
                    <td className="py-2 px-4 text-right font-black text-rose-600">-{formatRupiah(exp.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-black text-rose-700">
                <td colSpan={3} className="py-2.5 px-4 uppercase text-slate-800">TOTAL BEBAN PENGELUARAN KAS LACI</td>
                <td className="py-2.5 px-4 text-right text-sm">-{formatRupiah(data?.cashExpenses || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* TANDA TANGAN & PENGESAHAN LAPORAN (SAAT PRINT) */}
      <ReportFooter signerName="Admin AD Barbershop" />
    </div>
  );
}
