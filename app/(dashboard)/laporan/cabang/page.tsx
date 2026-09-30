"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Building2, CheckCircle, Clock, Filter, RefreshCw, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type BranchFilter = "All" | "Telkom" | "Suta";

export default function LaporanCabangPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BranchFilter>("All");
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = filter !== "All" ? `/api/branch-reports?branch=${filter}` : "/api/branch-reports";
      const res = await fetch(url);
      const data = await res.json();
      setReports(data.reports || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const handleMarkRead = async (id: string, isRead: boolean) => {
    setMarkingId(id);
    try {
      await fetch("/api/branch-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: !isRead }),
      });
      fetchReports();
    } finally {
      setMarkingId(null);
    }
  };

  const telkomReports = reports.filter((r) => r.branch === "Telkom");
  const sutaReports = reports.filter((r) => r.branch === "Suta");
  const unreadTelkom = telkomReports.filter((r) => !r.isRead).length;
  const unreadSuta = sutaReports.filter((r) => !r.isRead).length;

  const typeColor: Record<string, string> = {
    Harian: "bg-blue-100 text-blue-700",
    Mingguan: "bg-sky-100 text-sky-700",
    Bulanan: "bg-indigo-100 text-indigo-700",
    Keuangan: "bg-emerald-100 text-emerald-700",
    Stok: "bg-amber-100 text-amber-700",
    Umum: "bg-slate-100 text-slate-600",
  };

  const ReportCard = ({ r }: { r: any }) => (
    <div
      className={`p-4 rounded-xl border transition group ${
        !r.isRead
          ? "border-blue-200 bg-blue-50/50"
          : "border-slate-100 bg-white hover:border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-slate-800">{r.title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColor[r.type] || typeColor.Umum}`}>
              {r.type}
            </span>
            {!r.isRead && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-bold">
                BARU
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Dari: <strong>{r.fromAdmin}</strong> &bull; Periode: {r.period} &bull;{" "}
            {new Date(r.createdAt).toLocaleDateString("id-ID", {
              day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{r.content}</p>
        </div>
        <button
          onClick={() => handleMarkRead(r.id, r.isRead)}
          disabled={markingId === r.id}
          title={r.isRead ? "Tandai Belum Dibaca" : "Tandai Sudah Dibaca"}
          className={`flex-shrink-0 p-2 rounded-xl transition ${
            r.isRead
              ? "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
              : "text-blue-600 hover:bg-blue-100"
          }`}
        >
          {markingId === r.id ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
          ) : r.isRead ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Laporan Semua Cabang
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau laporan dari Cabang Telkom dan Cabang Suta dalam satu tempat.
          </p>
        </div>
        <Button onClick={fetchReports} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Laporan", value: reports.length, color: "text-slate-900", bg: "bg-slate-50", border: "border-slate-200" },
          { label: "Belum Dibaca", value: reports.filter(r => !r.isRead).length, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
          { label: "Lap. Telkom", value: telkomReports.length, color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", sub: `${unreadTelkom} belum dibaca` },
          { label: "Lap. Suta", value: sutaReports.length, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", sub: `${unreadSuta} belum dibaca` },
        ].map((s, i) => (
          <Card key={i} className={`p-4 ${s.bg} border ${s.border} shadow-none`}>
            <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            <div className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</div>
            {s.sub && <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>}
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["All", "Telkom", "Suta"] as BranchFilter[]).map((b) => (
          <button
            key={b}
            onClick={() => setFilter(b)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition border ${
              filter === b
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            }`}
          >
            {b === "All" ? "Semua Cabang" : `Cabang ${b}`}
            {b === "Telkom" && unreadTelkom > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadTelkom}</span>
            )}
            {b === "Suta" && unreadSuta > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadSuta}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm text-slate-400">Memuat laporan...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada laporan dari cabang</p>
          <p className="text-xs mt-1">Laporan dari admin cabang akan muncul di sini</p>
        </div>
      ) : filter === "All" ? (
        // Tampilkan per cabang jika filter All
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Telkom */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-3 h-3 rounded-full bg-sky-500" />
              <h3 className="font-bold text-sm text-slate-700">Cabang Telkom</h3>
              {unreadTelkom > 0 && (
                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unreadTelkom} baru</span>
              )}
            </div>
            {telkomReports.length === 0 ? (
              <div className="py-8 text-center text-slate-300 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs">Belum ada laporan dari Cabang Telkom</p>
              </div>
            ) : (
              telkomReports.map((r) => <ReportCard key={r.id} r={r} />)
            )}
          </div>
          {/* Suta */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <h3 className="font-bold text-sm text-slate-700">Cabang Suta</h3>
              {unreadSuta > 0 && (
                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unreadSuta} baru</span>
              )}
            </div>
            {sutaReports.length === 0 ? (
              <div className="py-8 text-center text-slate-300 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs">Belum ada laporan dari Cabang Suta</p>
              </div>
            ) : (
              sutaReports.map((r) => <ReportCard key={r.id} r={r} />)
            )}
          </div>
        </div>
      ) : (
        // Filter by branch
        <div className="space-y-3">
          {reports.map((r) => <ReportCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}
