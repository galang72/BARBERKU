"use client";

import React, { useState, useEffect } from "react";
import { Send, FileText, Clock, CheckCircle, Trash2, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const REPORT_TYPES = ["Harian", "Mingguan", "Bulanan", "Keuangan", "Stok", "Umum"];

export default function KirimLaporanPage() {
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [type, setType] = useState("Harian");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.authenticated) setUser(d.user); });
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/branch-reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Judul dan isi laporan wajib diisi!");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/branch-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, period, type }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal mengirim laporan");
        return;
      }
      setTitle("");
      setContent("");
      setType("Harian");
      alert("✅ Laporan berhasil dikirim ke Owner!");
      fetchReports();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan ini?")) return;
    await fetch(`/api/branch-reports?id=${id}`, { method: "DELETE" });
    fetchReports();
  };

  const branchLabel = user?.role === "ADMIN_TELKOM" ? "Telkom" : "Suta";
  const branchColor = user?.role === "ADMIN_TELKOM" ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-600" />
            Kirim Laporan ke Owner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan dari{" "}
            <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${branchColor}`}>
              Cabang {branchLabel}
            </span>{" "}
            akan langsung diterima oleh Owner.
          </p>
        </div>
      </div>

      {/* Form Kirim Laporan */}
      <Card className="p-6 border-blue-100 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Buat Laporan Baru
        </h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Judul */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Judul Laporan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="contoh: Laporan Harian Kamis 30 September"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              />
            </div>

            {/* Periode */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Periode
              </label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Tipe */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tipe Laporan
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Isi Laporan */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Isi Laporan <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Tulis isi laporan di sini... Contoh: Hari ini total transaksi 15 pelanggan, omzet Rp 600.000, stok pomade tersisa 10 pcs..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={sending}
            className="w-full sm:w-auto shadow-md shadow-blue-500/20"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengirim...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Kirim Laporan ke Owner
              </span>
            )}
          </Button>
        </form>
      </Card>

      {/* Riwayat Laporan */}
      <Card className="p-6 border-slate-100 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Riwayat Laporan Terkirim
          <span className="ml-auto text-xs font-normal text-slate-400">{reports.length} laporan</span>
        </h2>

        {loading ? (
          <div className="py-10 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Belum ada laporan yang dikirim</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r: any) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-100 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">{r.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {r.type}
                      </span>
                      {r.isRead ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Dibaca Owner
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Menunggu
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Periode: {r.period} &bull;{" "}
                      {new Date(r.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{r.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Hapus laporan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
