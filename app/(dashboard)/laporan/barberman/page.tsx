"use client";

import React, { useState, useEffect } from "react";
import {
  Scissors,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      const [resB, resDash] = await Promise.all([
        fetch("/api/barbermen"),
        fetch("/api/dashboard?filter=month"),
      ]);
      const dataB = await resB.json();
      const dataDash = await resDash.json();
      setBarbermen(dataB);
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
  const perfList = dashboardData?.barberPerformance || [];
  const selectedPerf = perfList.find((p: any) => p.id === selectedBarberId) || {
    customers: 0,
    transactions: 0,
    omzet: 0,
  };

  const totalAllCust = perfList.reduce((acc: number, p: any) => acc + (p.customers || 0), 0);
  const totalAllTrans = perfList.reduce((acc: number, p: any) => acc + (p.transactions || 0), 0);
  const totalAllOmzet = perfList.reduce((acc: number, p: any) => acc + (p.omzet || 0), 0);

  const currentPeriod = new Date().toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const handleExport = (type: "excel" | "csv") => {
    const formatted = [
      {
        "Nama Barberman": selectedBarber?.name,
        "Total Customer": selectedPerf.customers,
        "Total Transaksi": selectedPerf.transactions,
        "Total Omzet": selectedPerf.omzet,
      },
    ];
    if (type === "excel") exportToExcel(formatted, `Laporan_Barberman_${selectedBarber?.name}`);
    else exportToCSV(formatted, `Laporan_Barberman_${selectedBarber?.name}`);
  };

  return (
    <div className="report-printable space-y-6">
      {/* KOP RESMI CETAK */}
      <ReportHeader
        title="LAPORAN KINERJA PER BARBERMAN"
        subtitle={`Analisis Produktivitas & Kontribusi: ${selectedBarber?.name || "Semua Tim Barberman"}`}
        periodText={currentPeriod}
      />

      {/* HEADER WEB & ACTION BUTTONS */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>LAPORAN KINERJA PER BARBERMAN</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis produktivitas, jumlah customer, frekuensi potong, dan kontribusi omzet per barberman.
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* SELECTOR BARBERMAN (SEMBUNYI SAAT CETAK) */}
      <div className="no-print flex flex-wrap gap-2">
        {barbermen.map((b) => (
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
          </button>
        ))}
      </div>

      {/* METRICS OF SELECTED BARBERMAN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-stat p-4 bg-white border-blue-200 shadow-sm">
          <div className="text-xs text-blue-700 font-bold uppercase tracking-wider">Total Omzet ({selectedBarber?.name})</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {formatRupiah(selectedPerf.omzet)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Bulan berjalan</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Pelanggan Dilayani</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {selectedPerf.customers} orang
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Jumlah kunjungan customer</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Transaksi</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {selectedPerf.transactions}x
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Frekuensi layanan potong</div>
        </Card>

        <Card className="card-stat p-4 bg-white border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Rata-rata Pendapatan / Tamu</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatRupiah(selectedPerf.customers > 0 ? selectedPerf.omzet / selectedPerf.customers : 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ticket size rata-rata</div>
        </Card>
      </div>

      {/* COMPARISON TABLE */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Tabel Rekap & Perbandingan Semua Barberman
          </CardTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Barberman</th>
                <th className="py-2.5 px-3 text-center">Customer</th>
                <th className="py-2.5 px-3 text-center">Transaksi</th>
                <th className="py-2.5 px-3 text-right">Total Omzet</th>
                <th className="py-2.5 px-3 text-right">Rata-rata / Tamu</th>
                <th className="py-2.5 px-3 text-right">Porsi Omzet (%)</th>
                <th className="py-2.5 px-3 text-center no-print">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perfList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada data performa barberman tercatat.
                  </td>
                </tr>
              ) : (
                perfList.map((p: any, idx: number) => {
                  const isSelected = p.id === selectedBarberId;
                  const avg = p.customers > 0 ? Math.round(p.omzet / p.customers) : 0;
                  const share = totalAllOmzet > 0 ? ((p.omzet / totalAllOmzet) * 100).toFixed(1) : 0;
                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isSelected ? "bg-blue-50/70 font-bold" : "hover:bg-blue-50/30"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs no-print">
                          {p.name.charAt(0)}
                        </span>
                        <span>{p.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{p.customers} orang</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{p.transactions}x</td>
                      <td className="py-2.5 px-3 text-right font-black text-blue-700">{formatRupiah(p.omzet)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{formatRupiah(avg)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{share}%</td>
                      <td className="py-2.5 px-3 text-center text-xs no-print">
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">Terpilih</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-xs">
                <td className="py-2.5 px-3 text-blue-700">TOTAL KINERJA TIM</td>
                <td className="py-2.5 px-3 text-center text-slate-900">{totalAllCust} orang</td>
                <td className="py-2.5 px-3 text-center text-slate-900">{totalAllTrans}x</td>
                <td className="py-2.5 px-3 text-right text-blue-700 font-black">{formatRupiah(totalAllOmzet)}</td>
                <td className="py-2.5 px-3 text-right text-slate-600">{formatRupiah(totalAllCust > 0 ? totalAllOmzet / totalAllCust : 0)}</td>
                <td className="py-2.5 px-3 text-right text-emerald-700">100.0%</td>
                <td className="py-2.5 px-3 text-center text-slate-400 text-xs no-print">-</td>
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
