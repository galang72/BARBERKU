"use client";

import React, { useState, useEffect } from "react";
import {
  Scissors,
  Printer,
  FileSpreadsheet,
  Users,
  TrendingUp,
  Building2,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";
import { ReportHeader } from "@/components/reports/report-header";
import { ReportFooter } from "@/components/reports/report-footer";

export default function LaporanBarbermanPage() {
  const [barbermen, setBarbermen] = useState<any[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ambil semua barberman (tanpa filter branch) + performa gabungan semua cabang
      const [resB, resDash] = await Promise.all([
        fetch("/api/barbermen?all=true"),
        fetch("/api/dashboard?filter=month"),
      ]);
      const dataB = await resB.json();
      const dataDash = await resDash.json();
      setBarbermen(Array.isArray(dataB) ? dataB : []);
      if (dataB.length > 0 && !selectedBarberId) {
        setSelectedBarberId(dataB[0].id);
      }
      setDashboardData(dataDash);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedBarber = barbermen.find((b) => b.id === selectedBarberId) || barbermen[0];

  // Performa dari dashboard (gabungan semua cabang Telkom + Suta)
  const perfList: any[] = dashboardData?.barberPerformance || [];

  // Gabungkan data barberman + performa, termasuk barberman yang belum ada transaksi
  const mergedList = barbermen.map((b) => {
    const perf = perfList.find((p: any) => p.id === b.id) || { customers: 0, transactions: 0, omzet: 0 };
    return { ...b, ...perf };
  });

  const selectedPerf = mergedList.find((p) => p.id === selectedBarberId) || {
    customers: 0, transactions: 0, omzet: 0,
  };

  const totalAllCust = mergedList.reduce((acc, p) => acc + (p.customers || 0), 0);
  const totalAllTrans = mergedList.reduce((acc, p) => acc + (p.transactions || 0), 0);
  const totalAllOmzet = mergedList.reduce((acc, p) => acc + (p.omzet || 0), 0);

  const currentPeriod = new Date().toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const handleExportAll = (type: "excel" | "csv") => {
    const formatted = mergedList.map((p) => ({
      "Nama Barberman": p.name,
      "Total Customer (Semua Cabang)": p.customers,
      "Total Transaksi (Semua Cabang)": p.transactions,
      "Total Omzet": p.omzet,
      "Rata-rata per Tamu": p.customers > 0 ? Math.round(p.omzet / p.customers) : 0,
      "Porsi Omzet (%)":
        totalAllOmzet > 0 ? ((p.omzet / totalAllOmzet) * 100).toFixed(1) + "%" : "0%",
      "Status": p.isActive !== false ? "Aktif" : "Nonaktif",
    }));
    if (type === "excel") exportToExcel(formatted, `Laporan_Barberman_Gabungan_${currentPeriod}`);
    else exportToCSV(formatted, `Laporan_Barberman_Gabungan_${currentPeriod}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Memuat data barberman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-printable space-y-6">
      {/* KOP RESMI CETAK */}
      <ReportHeader
        title="LAPORAN KINERJA PER BARBERMAN"
        subtitle={`Rekap Gabungan Cabang Telkom & Suta — ${selectedBarber?.name || "Semua Tim"}`}
        periodText={currentPeriod}
      />

      {/* HEADER WEB */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>LAPORAN KINERJA BARBERMAN</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            Akumulasi dari <strong>Cabang Telkom + Cabang Suta</strong> — semua barberman bisa bertugas di kedua cabang
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => handleExportAll("excel")} variant="outline" size="sm" className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Excel
          </Button>
          <Button onClick={() => window.print()} variant="primary" size="sm" className="shadow-md shadow-blue-500/20">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* INFO BANNER */}
      <div className="no-print p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-800">
        <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span>
          <strong>6 Barberman</strong> (Ade, Arif, Akmal, Ari, Azis, Dani) dapat bertugas di <strong>Cabang Telkom maupun Suta</strong>.
          Data customer di bawah merupakan akumulasi dari kedua cabang.
        </span>
      </div>

      {/* SELECTOR BARBERMAN */}
      <div className="no-print flex flex-wrap gap-2">
        {mergedList.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBarberId(b.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
              selectedBarberId === b.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>💈 {b.name}</span>
            {b.customers > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                selectedBarberId === b.id ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
              }`}>
                {b.customers}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* METRICS BARBERMAN TERPILIH */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-stat p-4 bg-white border-blue-200 shadow-sm">
          <div className="text-xs text-blue-700 font-bold uppercase tracking-wider">
            Total Omzet
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {formatRupiah(selectedPerf.omzet)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            💈 {selectedBarber?.name} — Semua Cabang
          </div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Total Customer
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {selectedPerf.customers} <span className="text-sm font-normal text-slate-400">orang</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Telkom + Suta gabungan</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Transaksi</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {selectedPerf.transactions}<span className="text-sm font-normal text-slate-400">x</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Frekuensi layanan potong</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Avg per Tamu
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatRupiah(selectedPerf.customers > 0 ? selectedPerf.omzet / selectedPerf.customers : 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ticket size rata-rata</div>
        </Card>
      </div>

      {/* TABEL REKAP SEMUA BARBERMAN — GABUNGAN KEDUA CABANG */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Rekap Semua Barberman — Gabungan Cabang Telkom & Suta
          </CardTitle>
          <Badge variant="blue">Bulan {currentPeriod}</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Barberman</th>
                <th className="py-2.5 px-3 text-center">Customer (Gabungan)</th>
                <th className="py-2.5 px-3 text-center">Transaksi</th>
                <th className="py-2.5 px-3 text-right">Total Omzet</th>
                <th className="py-2.5 px-3 text-right">Rata-rata / Tamu</th>
                <th className="py-2.5 px-3 text-right">Porsi (%)</th>
                <th className="py-2.5 px-3 text-center no-print">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mergedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada data barberman.
                  </td>
                </tr>
              ) : (
                mergedList.map((p, idx) => {
                  const isSelected = p.id === selectedBarberId;
                  const avg = p.customers > 0 ? Math.round(p.omzet / p.customers) : 0;
                  const share = totalAllOmzet > 0 ? ((p.omzet / totalAllOmzet) * 100).toFixed(1) : "0.0";
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedBarberId(p.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-50/70 font-bold" : "hover:bg-blue-50/30"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-xs no-print">
                            {p.name.charAt(0)}
                          </span>
                          <span>💈 {p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-black text-base ${p.customers > 0 ? "text-blue-700" : "text-slate-300"}`}>
                          {p.customers}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1">orang</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{p.transactions}x</td>
                      <td className="py-2.5 px-3 text-right font-black text-blue-700">{formatRupiah(p.omzet)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{formatRupiah(avg)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-bold ${Number(share) >= 20 ? "text-emerald-700" : "text-slate-500"}`}>
                          {share}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center no-print">
                        {p.isActive !== false ? (
                          <Badge variant="green">Aktif</Badge>
                        ) : (
                          <Badge variant="red">Nonaktif</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-xs">
                <td className="py-2.5 px-3 text-blue-700 font-black">TOTAL TIM (6 Barberman)</td>
                <td className="py-2.5 px-3 text-center text-slate-900 font-black">{totalAllCust} orang</td>
                <td className="py-2.5 px-3 text-center text-slate-900">{totalAllTrans}x</td>
                <td className="py-2.5 px-3 text-right text-blue-700 font-black">{formatRupiah(totalAllOmzet)}</td>
                <td className="py-2.5 px-3 text-right text-slate-600">
                  {formatRupiah(totalAllCust > 0 ? totalAllOmzet / totalAllCust : 0)}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700 font-black">100.0%</td>
                <td className="py-2.5 px-3 text-center text-slate-400 no-print">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* TANDA TANGAN CETAK */}
      <ReportFooter signerName="Owner AD Barbershop" />
    </div>
  );
}
