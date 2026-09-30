"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Calendar,
  DollarSign,
  ArrowRight,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDateTimeIndo } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";

export default function PenjualanPage() {
  const [dailyData, setDailyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/daily");
      const json = await res.json();
      setDailyData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, []);

  const transactions = dailyData?.transactions || [];
  const productSalesList: any[] = [];
  for (const t of transactions) {
    for (const it of t.items || []) {
      if (it.itemType === "PRODUCT") {
        productSalesList.push({
          invoiceNumber: t.invoiceNumber,
          customerName: t.customerName,
          barbermanName: t.barberman?.name || "-",
          productName: it.name,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
          createdAt: t.createdAt,
        });
      }
    }
  }

  const handleExport = (type: "excel" | "csv") => {
    const formatted = productSalesList.map((p) => ({
      "No. Invoice": p.invoiceNumber,
      "Customer": p.customerName,
      "Barberman": p.barbermanName,
      "Produk": p.productName,
      "Jumlah (Qty)": p.quantity,
      "Harga": p.price,
      "Subtotal": p.subtotal,
      "Waktu": formatDateTimeIndo(p.createdAt),
    }));
    if (type === "excel") exportToExcel(formatted, "Penjualan_Produk_Hari_Ini");
    else exportToCSV(formatted, "Penjualan_Produk_Hari_Ini");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>PENJUALAN PRODUK GROOMING</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring penjualan pomade, hair tonic, styling powder, dan produk perawatan pria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleExport("excel")} variant="secondary" size="sm">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Excel
          </Button>
          <Link
            href="/kasir"
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Jual di Kasir</span>
          </Link>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-blue-200 bg-blue-50/60">
          <div className="text-xs font-semibold text-blue-800">Total Omzet Produk Hari Ini</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {formatRupiah(dailyData?.productSales || 0)}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Hasil retail kasir</div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Penjualan Pomade Hari Ini</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatRupiah(dailyData?.pomadeOmzet || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {dailyData?.pomadeSold || 0} unit terjual
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Tonic & Powder Hari Ini</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatRupiah(dailyData?.tonicPowderOmzet || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {dailyData?.tonicPowderSold || 0} unit terjual
          </div>
        </Card>
      </div>

      {/* SALES ITEMS TABLE */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Invoice</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Barberman</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4 text-center">Qty</th>
                <th className="py-3.5 px-4 text-right">Harga Satuan</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
                <th className="py-3.5 px-4 text-right">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat riwayat penjualan...</span>
                    </div>
                  </td>
                </tr>
              ) : productSalesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Belum ada transaksi produk hari ini. Buka kasir untuk mulai transaksi.
                  </td>
                </tr>
              ) : (
                productSalesList.map((p, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-700">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.customerName}</td>
                    <td className="py-3.5 px-4 text-xs text-blue-600 font-semibold">
                      💈 {p.barbermanName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">{p.productName}</td>
                    <td className="py-3.5 px-4 text-center font-black text-slate-800">
                      {p.quantity}x
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-700">
                      {formatRupiah(p.subtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                      {formatDateTimeIndo(p.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
