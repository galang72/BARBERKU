"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Scissors,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";
import { ReportHeader } from "@/components/reports/report-header";
import { ReportFooter } from "@/components/reports/report-footer";

export default function LaporanHarianPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/daily?date=${selectedDate}`);
      const json = await res.json();
      setReport(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate]);

  const handleExport = (type: "excel" | "csv") => {
    const barberData = (report?.barbermanPerformance || []).map((b: any) => ({
      "Barberman": b.name,
      "Customer": b.customerCount,
      "Transaksi": b.transactionCount,
      "Omzet": b.omzet,
    }));
    if (type === "excel") exportToExcel(barberData, `Laporan_Harian_${selectedDate}`);
    else exportToCSV(barberData, `Laporan_Harian_${selectedDate}`);
  };

  const totalBarberCust = (report?.barbermanPerformance || []).reduce((acc: number, b: any) => acc + (b.customerCount || 0), 0);
  const totalBarberTrans = (report?.barbermanPerformance || []).reduce((acc: number, b: any) => acc + (b.transactionCount || 0), 0);
  const totalBarberOmzet = (report?.barbermanPerformance || []).reduce((acc: number, b: any) => acc + (b.omzet || 0), 0);

  return (
    <div className="report-printable space-y-6">
      {/* KOP RESMI CETAK */}
      <ReportHeader
        title="LAPORAN OPERASIONAL HARIAN"
        subtitle="Rekap Komprehensif: Pendapatan Layanan, Ritel Produk, Arus Kas & Kontribusi Barberman"
        periodText={formatDateIndo(selectedDate)}
      />

      {/* HEADER WEB & ACTION BUTTONS */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>LAPORAN OPERASIONAL HARIAN</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekap komprehensif harian: Layanan, Produk, Pomade/Tonic/Powder, Arus Kas, dan Barberman.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
          />
          <Button onClick={() => handleExport("excel")} variant="outline" size="sm" className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Excel
          </Button>
          <Button onClick={() => window.print()} variant="primary" size="sm" className="shadow-md shadow-blue-500/20">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-stat p-4 bg-white border-blue-200 shadow-sm">
          <div className="text-xs text-blue-700 font-bold uppercase tracking-wider">Total Omzet Harian</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {formatRupiah(report?.totalOmzet || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Layanan + Produk</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Customer & Transaksi</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {report?.totalCustomers || 0} / {report?.totalTransactions || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tamu dilayani & struk</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Penjualan Layanan</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatRupiah(report?.serviceSales || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Haircut & Treatment</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Penjualan Produk Retail</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatRupiah(report?.productSales || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pomade, Tonic & Powder</div>
        </Card>
      </div>

      {/* BREAKDOWN PRODUK & ARUS KAS HARIAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Produk Pomade & Tonic/Powder */}
        <Card className="card-stat p-5 border-slate-200/80 shadow-sm bg-white">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
            Penjualan Kategori Khusus
          </CardTitle>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs">Produk Pomade</div>
                <div className="text-[11px] text-slate-500">Terjual: {report?.pomadeSold || 0} unit</div>
              </div>
              <div className="font-black text-blue-700 text-sm">
                {formatRupiah(report?.pomadeOmzet || 0)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs">Tonic & Powder</div>
                <div className="text-[11px] text-slate-500">Terjual: {report?.tonicPowderSold || 0} unit</div>
              </div>
              <div className="font-black text-blue-700 text-sm">
                {formatRupiah(report?.tonicPowderOmzet || 0)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs">Aktivitas Booking & Member</div>
                <div className="text-[11px] text-slate-500">Jadwal & Member Terdaftar</div>
              </div>
              <div className="text-right text-xs">
                <span className="text-blue-700 font-bold">{report?.bookingsCount || 0} booking</span>
                <span className="text-slate-400"> • </span>
                <span className="text-emerald-600 font-bold">{report?.newMembersCount || 0} member</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Kas Masuk & Kas Keluar */}
        <Card className="card-stat p-5 border-slate-200/80 shadow-sm bg-white">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
            Ringkasan Arus Kas Laci
          </CardTitle>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-700 font-semibold">Total Kas Masuk (Cash In)</span>
              </div>
              <div className="font-black text-emerald-700 text-sm">
                +{formatRupiah(report?.cashIn || 0)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span className="text-xs text-slate-700 font-semibold">Total Kas Keluar (Cash Out)</span>
              </div>
              <div className="font-black text-rose-700 text-sm">
                -{formatRupiah(report?.cashOut || 0)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <span className="text-xs text-blue-900 font-bold uppercase">Kas Bersih Hari Ini</span>
              <div className="font-black text-blue-700 text-base">
                {formatRupiah(report?.cashEnding || 0)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* PERFORMA BARBERMAN HARI INI */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-blue-600 no-print" />
            <span>Performa Barberman Hari Ini ({formatDateIndo(selectedDate)})</span>
          </CardTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Barberman</th>
                <th className="py-3 px-4 text-center">Customer Dilayani</th>
                <th className="py-3 px-4 text-center">Jumlah Transaksi</th>
                <th className="py-3 px-4 text-right">Kontribusi Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {(report?.barbermanPerformance || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada data transaksi barberman pada tanggal ini.
                  </td>
                </tr>
              ) : (
                (report?.barbermanPerformance || []).map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-blue-50/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs no-print">
                        {b.name.charAt(0)}
                      </span>
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{b.customerCount} orang</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{b.transactionCount}x</td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-700">{formatRupiah(b.omzet)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-sm">
                <td className="py-3.5 px-4 text-blue-700">TOTAL PERFORMA</td>
                <td className="py-3.5 px-4 text-center text-slate-800">{totalBarberCust} orang</td>
                <td className="py-3.5 px-4 text-center text-slate-800">{totalBarberTrans}x</td>
                <td className="py-3.5 px-4 text-right text-blue-700 font-black">{formatRupiah(totalBarberOmzet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* DAFTAR JURNAL TRANSAKSI KASIR HARI INI */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600 no-print" />
            <span>Jurnal Transaksi Kasir ({formatDateIndo(selectedDate)})</span>
          </CardTitle>
          <span className="text-xs text-slate-500 font-mono font-medium">
            {(report?.transactions || []).length} struk tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3 px-3">No. Invoice</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3">Barberman</th>
                <th className="py-3 px-3">Item Layanan / Produk</th>
                <th className="py-3 px-3 text-center">Metode</th>
                <th className="py-3 px-3 text-right">Total Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(report?.transactions || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada transaksi kasir pada tanggal ini.
                  </td>
                </tr>
              ) : (
                (report?.transactions || []).map((t: any, idx: number) => {
                  const itemsSummary = (t.items || []).map((it: any) => `${it.name}${it.quantity > 1 ? ` x${it.quantity}` : ''}`).join(", ");
                  const timeStr = new Date(t.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <tr key={idx} className="hover:bg-blue-50/40">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{t.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-500">{timeStr} WIB</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {t.customerName}
                        {t.customerPhone ? <span className="text-[10px] text-slate-400 block">{t.customerPhone}</span> : null}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{t.barberman?.name || "-"}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={itemsSummary}>
                        {itemsSummary}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">{formatRupiah(t.grandTotal)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-xs">
                <td colSpan={6} className="py-3 px-3 text-blue-700 uppercase">
                  TOTAL KASIR HARI INI
                </td>
                <td className="py-3 px-3 text-right text-blue-700 font-black text-sm">
                  {formatRupiah(report?.totalOmzet || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* TANDA TANGAN & PENGESAHAN LAPORAN (SAAT PRINT) */}
      <ReportFooter signerName="Admin Kasir AD Barbershop" />
    </div>
  );
}
