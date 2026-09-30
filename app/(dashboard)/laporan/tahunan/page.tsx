"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  FileSpreadsheet,
  BarChart3,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";
import { ReportHeader } from "@/components/reports/report-header";
import { ReportFooter } from "@/components/reports/report-footer";

export default function LaporanTahunanPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [annualData, setAnnualData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnnual = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/annual?year=${selectedYear}`);
      const json = await res.json();
      setAnnualData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnual();
  }, [selectedYear]);

  const months = annualData?.months || [];
  const summary = annualData?.summary || {};

  // Maximum value for chart scaling
  const maxOmzet = Math.max(...months.map((m: any) => m.omzet || 0), 1000000);

  const handleExport = (type: "excel" | "csv") => {
    const formatted = months.map((m: any) => ({
      "Bulan": m.month,
      "Customer": m.customer,
      "Transaksi": m.transactions,
      "Omzet Keseluruhan": m.omzet,
      "Penjualan Produk": m.productOmzet,
    }));
    if (type === "excel") exportToExcel(formatted, `Laporan_Tahunan_${selectedYear}`);
    else exportToCSV(formatted, `Laporan_Tahunan_${selectedYear}`);
  };

  return (
    <div className="report-printable space-y-6">
      {/* KOP RESMI CETAK */}
      <ReportHeader
        title="LAPORAN KEUANGAN TAHUNAN"
        subtitle="Rekapitulasi 12 Bulan (Januari - Desember): Tren Pendapatan, Kunjungan Tamu & Retail Produk"
        periodText={`Tahun ${selectedYear}`}
      />

      {/* HEADER WEB & ACTION BUTTONS */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>LAPORAN KEUANGAN TAHUNAN</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekapitulasi 12 bulan (Januari - Desember): tren pendapatan, volume tamu, dan penjualan produk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500"
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
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

      {/* SUMMARY TOTAL ANNUAL CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-stat p-4 bg-white border-blue-200 shadow-sm">
          <div className="text-xs text-blue-700 font-bold uppercase tracking-wider">Total Omzet Tahun {selectedYear}</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {formatRupiah(summary.totalOmzet || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Akumulasi 12 Bulan</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Customer Dilayani</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {summary.totalCustomer || 0} orang
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Volume kunjungan</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Transaksi Kasir</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {summary.totalTransactions || 0} struk
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Transaksi tercatat</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Penjualan Produk</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatRupiah(summary.totalProductSales || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Retail Pomade & Tonic</div>
        </Card>
      </div>

      {/* GRAFIK OMZET BULANAN (VISUAL BAR CHART - SEMBUNYI SAAT CETAK) */}
      <Card className="no-print p-6 border-slate-200/80 shadow-sm bg-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Grafik Tren Omzet Bulanan Sepanjang Tahun {selectedYear}</span>
          </CardTitle>
          <span className="text-xs text-slate-500 font-medium">Januari - Desember</span>
        </div>

        {/* CSS Flex Bar Chart */}
        <div className="mt-6 flex items-end justify-between gap-2 h-56 pt-6 px-2 bg-slate-50/50 rounded-xl border border-slate-100">
          {months.map((m: any, idx: number) => {
            const heightPercent = Math.max(8, Math.round((m.omzet / maxOmzet) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white font-medium px-2 py-1 rounded pointer-events-none whitespace-nowrap shadow-md">
                  {formatRupiah(m.omzet)}
                </div>
                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                    m.omzet > 0
                      ? "bg-gradient-to-t from-blue-700 to-blue-500 group-hover:from-blue-600 group-hover:to-blue-400 shadow-md shadow-blue-500/20"
                      : "bg-slate-200"
                  }`}
                />
                {/* Month Label */}
                <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-700 transition">
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* TABEL LENGKAP 12 BULAN (JANUARI - DESEMBER) */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Rincian Kinerja Bulanan (Januari - Desember)
          </CardTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Bulan</th>
                <th className="py-3.5 px-4 text-center">Customer</th>
                <th className="py-3.5 px-4 text-center">Transaksi</th>
                <th className="py-3.5 px-4 text-right">Penjualan Produk</th>
                <th className="py-3.5 px-4 text-right">Total Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {months.map((m: any, idx: number) => (
                <tr key={idx} className="hover:bg-blue-50/40">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-mono no-print">
                      {m.monthNumber}
                    </span>
                    <span>{m.month}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">{m.customer} orang</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">{m.transactions}x</td>
                  <td className="py-3.5 px-4 text-right text-slate-600 font-semibold">{formatRupiah(m.productOmzet)}</td>
                  <td className="py-3.5 px-4 text-right font-black text-blue-700 text-base">{formatRupiah(m.omzet)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-sm">
                <td className="py-3.5 px-4 text-blue-700">TOTAL 1 TAHUN</td>
                <td className="py-3.5 px-4 text-center text-slate-900">{summary.totalCustomer || 0} orang</td>
                <td className="py-3.5 px-4 text-center text-slate-900">{summary.totalTransactions || 0}x</td>
                <td className="py-3.5 px-4 text-right text-slate-700 font-semibold">{formatRupiah(summary.totalProductSales || 0)}</td>
                <td className="py-3.5 px-4 text-right text-blue-700 font-black text-base">{formatRupiah(summary.totalOmzet || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* TANDA TANGAN & PENGESAHAN LAPORAN (SAAT PRINT) */}
      <ReportFooter signerName="Admin AD Barbershop" />
    </div>
  );
}
