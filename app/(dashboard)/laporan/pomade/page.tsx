"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  FileSpreadsheet,
  Award,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportHeader } from "@/components/reports/report-header";
import { ReportFooter } from "@/components/reports/report-footer";
import { formatRupiah } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";

export default function LaporanPomadePage() {
  const [filter, setFilter] = useState("month");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/category?category=pomade&filter=${filter}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filter]);

  const topProducts = data?.topProducts || [];

  const getPeriodLabel = () => {
    switch (filter) {
      case "today":
        return "Hari Ini";
      case "week":
        return "Minggu Ini";
      case "month":
        return "Bulan Ini";
      case "year":
        return "Tahun Ini";
      default:
        return "Semua Periode";
    }
  };

  const handleExport = (type: "excel" | "csv") => {
    const formatted = topProducts.map((p: any) => ({
      "SKU": p.sku,
      "Nama Produk Pomade": p.name,
      "Terjual (Qty)": p.sold,
      "Harga Jual": p.sellingPrice,
      "Harga Modal": p.costPrice,
      "Total Omzet": p.omzet,
      "Total Modal": p.modal,
      "Estimasi Laba Bersih": p.profit,
      "Sisa Stok": p.stock,
    }));
    if (type === "excel") exportToExcel(formatted, `Laporan_Pomade_${filter}`);
    else exportToCSV(formatted, `Laporan_Pomade_${filter}`);
  };

  return (
    <div className="report-printable space-y-6">
      {/* KOP RESMI LAPORAN SAAT PRINT */}
      <ReportHeader
        title="LAPORAN KHUSUS PENJUALAN PRODUK POMADE"
        subtitle="Analisis Ritel Pomade, Estimasi Keuntungan Kotor, dan Monitoring Sisa Stok"
        periodText={getPeriodLabel()}
      />

      {/* HEADER WEB & ACTION BUTTONS (SEMBUNYI SAAT PRINT) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>LAPORAN KHUSUS POMADE</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis penjualan pomade (Suavecito, Chief, Murray&apos;s, Gatsby), estimasi laba, dan sisa stok.
          </p>
        </div>

        {/* DATE FILTER BUTTONS */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          {[
            { id: "today", label: "Hari Ini" },
            { id: "week", label: "Minggu Ini" },
            { id: "month", label: "Bulan Ini" },
            { id: "year", label: "Tahun Ini" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === item.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {item.label}
            </button>
          ))}
          <Button onClick={() => handleExport("excel")} variant="outline" size="sm" className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Excel
          </Button>
          <Button onClick={() => window.print()} variant="primary" size="sm" className="shadow-md shadow-blue-500/20">
            <Printer className="w-3.5 h-3.5 mr-1" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="card-stat rounded-xl p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Pomade Terjual</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {data?.totalSold || 0} unit
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total volume ritel</div>
        </div>

        <div className="card-stat rounded-xl p-4 bg-white border border-blue-200 shadow-sm">
          <div className="text-xs text-blue-700 font-bold">Total Omzet Pomade</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {formatRupiah(data?.totalOmzet || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Penjualan kotor</div>
        </div>

        <div className="card-stat rounded-xl p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Modal (COGS)</div>
          <div className="text-2xl font-black text-slate-700 mt-1">
            {formatRupiah(data?.totalModal || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Harga pengadaan</div>
        </div>

        <div className="card-stat rounded-xl p-4 bg-emerald-50/50 border border-emerald-200 shadow-sm">
          <div className="text-xs text-emerald-700 font-bold">Estimasi Laba Kotor</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatRupiah(data?.totalProfit || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Omzet dikurangi modal</div>
        </div>

        <div className="card-stat rounded-xl p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Sisa Stok Rak</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {data?.currentStock || 0} pot
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Katalog aktif</div>
        </div>
      </div>

      {/* TOP SELLER & PRODUCT BREAKDOWN TABLE */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600 no-print" />
            <span>Rincian Produk Pomade Terlaris & Profitabilitas</span>
          </CardTitle>
          <span className="text-xs text-slate-500 font-medium">
            {topProducts.length} varian pomade
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">No / Nama Produk</th>
                <th className="py-3 px-4 text-center">Terjual</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-right">Harga Modal</th>
                <th className="py-3 px-4 text-right">Total Omzet</th>
                <th className="py-3 px-4 text-right">Keuntungan (Profit)</th>
                <th className="py-3 px-4 text-center">Sisa Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data laporan pomade...
                  </td>
                </tr>
              ) : topProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada data penjualan pomade pada periode ini.
                  </td>
                </tr>
              ) : (
                topProducts.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-blue-50/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs no-print">
                        #{idx + 1}
                      </div>
                      <div>
                        <div>{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 font-normal">
                          {p.sku}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold">
                        {p.sold} unit
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-600">
                      {formatRupiah(p.sellingPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                      {formatRupiah(p.costPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-700">
                      {formatRupiah(p.omzet)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                      +{formatRupiah(p.profit)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-xs text-blue-700">
                      {p.stock} pot
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {topProducts.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-sm">
                  <td className="py-3 px-4 text-blue-700">TOTAL KESELURUHAN</td>
                  <td className="py-3 px-4 text-center text-slate-900">{data?.totalSold || 0} unit</td>
                  <td className="py-3 px-4 text-right text-slate-400">-</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(data?.totalModal || 0)}</td>
                  <td className="py-3 px-4 text-right text-blue-700 font-black">{formatRupiah(data?.totalOmzet || 0)}</td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-black">+{formatRupiah(data?.totalProfit || 0)}</td>
                  <td className="py-3 px-4 text-center text-blue-700">{data?.currentStock || 0} pot</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* FOOTER TANDA TANGAN SAAT PRINT */}
      <ReportFooter />
    </div>
  );
}
