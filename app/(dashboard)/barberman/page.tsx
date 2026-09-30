"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Eye,
  MapPin,
  Coffee,
  BarChart2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatRupiah } from "@/lib/utils";

export default function BarbermanPage() {
  const [barbermen, setBarbermen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formNickname, setFormNickname] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwner = session?.role === "OWNER";
  const myBranch = session?.branch || "";

  const loadData = async () => {
    setLoading(true);
    try {
      const [resB, resDash, resSess] = await Promise.all([
        fetch("/api/barbermen?all=true"),
        fetch("/api/dashboard?filter=month"),
        fetch("/api/auth/me"),
      ]);
      const dataB = await resB.json();
      const dataDash = await resDash.json();
      const dataSess = await resSess.json();
      setBarbermen(Array.isArray(dataB) ? dataB : []);
      setDashboardStats(dataDash);
      setSession(dataSess);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getStatus = (b: any) => {
    if (!b.isActive) return "LIBUR";
    if (b.branch === "Telkom") return "TELKOM";
    if (b.branch === "Suta") return "SUTA";
    return "LIBUR";
  };

  const getStats = (id: string) => {
    const perf = dashboardStats?.barberPerformance?.find((p: any) => p.id === id);
    return perf || { customers: 0, transactions: 0, omzet: 0 };
  };

  // ─── ADMIN ACTIONS ────────────────────────────────────────────────
  const handleAssignHere = async (b: any) => {
    if (togglingId) return;
    setTogglingId(b.id);
    setBarbermen((prev) => prev.map((item) => item.id === b.id ? { ...item, isActive: true, branch: myBranch } : item));
    try {
      await fetch("/api/barbermen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, isActive: true, branch: myBranch }),
      });
    } catch {
      setBarbermen((prev) => prev.map((item) => item.id === b.id ? { ...item, isActive: b.isActive, branch: b.branch } : item));
    } finally { setTogglingId(null); }
  };

  const handleSetLibur = async (b: any) => {
    if (togglingId) return;
    if (!confirm(`Tandai ${b.name} sebagai LIBUR?\nDia akan nonaktif di semua cabang.`)) return;
    setTogglingId(b.id);
    setBarbermen((prev) => prev.map((item) => item.id === b.id ? { ...item, isActive: false } : item));
    try {
      await fetch("/api/barbermen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, isActive: false }),
      });
    } catch {
      setBarbermen((prev) => prev.map((item) => item.id === b.id ? { ...item, isActive: b.isActive } : item));
    } finally { setTogglingId(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus barberman "${name}"?`)) return;
    await fetch(`/api/barbermen?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const openAddModal = () => { setEditId(null); setFormName(""); setFormNickname(""); setFormPhone(""); setModalOpen(true); };
  const openEditModal = (b: any) => { setEditId(b.id); setFormName(b.name); setFormNickname(b.nickname || ""); setFormPhone(b.phone || ""); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { alert("Nama wajib diisi!"); return; }
    setSaving(true);
    try {
      const payload: any = { name: formName.trim(), nickname: formNickname.trim() || null, phone: formPhone.trim() || null };
      if (editId) {
        await fetch("/api/barbermen", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...payload }) });
      } else {
        const branch = myBranch !== "All" ? myBranch : "Telkom";
        await fetch("/api/barbermen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, branch, isActive: true }) });
      }
      setModalOpen(false); loadData();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  // ─── OWNER VIEW: Monitoring & Perbandingan Cabang ─────────────────
  const OwnerView = () => {
    const telkomBarbermen = barbermen.filter((b) => b.branch === "Telkom");
    const sutaBarbermen = barbermen.filter((b) => b.branch === "Suta");
    const liburBarbermen = barbermen.filter((b) => !b.isActive);

    const telkomStats = telkomBarbermen.reduce((acc, b) => {
      const s = getStats(b.id);
      return { customers: acc.customers + s.customers, omzet: acc.omzet + s.omzet };
    }, { customers: 0, omzet: 0 });

    const sutaStats = sutaBarbermen.reduce((acc, b) => {
      const s = getStats(b.id);
      return { customers: acc.customers + s.customers, omzet: acc.omzet + s.omzet };
    }, { customers: 0, omzet: 0 });

    const allStats = dashboardStats?.barberPerformance || [];
    const totalCust = allStats.reduce((a: number, p: any) => a + p.customers, 0);
    const totalOmzet = allStats.reduce((a: number, p: any) => a + p.omzet, 0);

    return (
      <div className="space-y-6">

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-blue-200 shadow-sm">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Aktif Cabang Telkom</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{telkomBarbermen.filter(b=>b.isActive).length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">dari 6 barberman</div>
          </Card>
          <Card className="p-4 bg-white border-indigo-200 shadow-sm">
            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Aktif Cabang Suta</div>
            <div className="text-2xl font-black text-indigo-700 mt-1">{sutaBarbermen.filter(b=>b.isActive).length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">dari 6 barberman</div>
          </Card>
          <Card className="p-4 bg-white border-amber-200 shadow-sm">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Sedang Libur</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{liburBarbermen.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">nonaktif hari ini</div>
          </Card>
          <Card className="p-4 bg-white border-emerald-200 shadow-sm">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Customer Bulan Ini</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{totalCust}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{formatRupiah(totalOmzet)}</div>
          </Card>
        </div>

        {/* PERBANDINGAN CABANG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cabang Telkom */}
          <Card className="border-blue-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-blue-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white" />
                <span className="font-black text-white text-sm">Cabang Telkom</span>
              </div>
              <div className="text-right">
                <div className="text-white text-xs font-bold">{formatRupiah(telkomStats.omzet)}</div>
                <div className="text-blue-200 text-[10px]">{telkomStats.customers} customer</div>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {telkomBarbermen.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 italic">Belum ada barberman ditugaskan</p>
              ) : telkomBarbermen.map((b) => {
                const s = getStats(b.id);
                return (
                  <div key={b.id} className={`px-4 py-3 flex items-center justify-between ${!b.isActive ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${b.isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{b.name}</div>
                        <div className="text-[10px] text-slate-400">{b.nickname || "Stylist"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-black text-blue-700">{s.customers} <span className="font-normal text-slate-400">cust</span></div>
                        <div className="text-[10px] text-slate-400">{formatRupiah(s.omzet)}</div>
                      </div>
                      {b.isActive
                        ? <Badge variant="green">Aktif</Badge>
                        : <Badge variant="red">Libur</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Cabang Suta */}
          <Card className="border-indigo-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-indigo-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white" />
                <span className="font-black text-white text-sm">Cabang Suta</span>
              </div>
              <div className="text-right">
                <div className="text-white text-xs font-bold">{formatRupiah(sutaStats.omzet)}</div>
                <div className="text-indigo-200 text-[10px]">{sutaStats.customers} customer</div>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {sutaBarbermen.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 italic">Belum ada barberman ditugaskan</p>
              ) : sutaBarbermen.map((b) => {
                const s = getStats(b.id);
                return (
                  <div key={b.id} className={`px-4 py-3 flex items-center justify-between ${!b.isActive ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${b.isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"}`}>
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{b.name}</div>
                        <div className="text-[10px] text-slate-400">{b.nickname || "Stylist"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-black text-indigo-700">{s.customers} <span className="font-normal text-slate-400">cust</span></div>
                        <div className="text-[10px] text-slate-400">{formatRupiah(s.omzet)}</div>
                      </div>
                      {b.isActive
                        ? <Badge variant="green">Aktif</Badge>
                        : <Badge variant="red">Libur</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* TABEL REKAP SEMUA BARBERMAN — GABUNGAN */}
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              Rekap Kinerja Semua Barberman (Gabungan Telkom + Suta)
            </CardTitle>
            <Link href="/laporan/barberman" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Laporan Detail
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-4">Barberman</th>
                  <th className="py-2.5 px-4 text-center">Cabang</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-center">Customer</th>
                  <th className="py-2.5 px-4 text-right">Omzet Bulan Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {barbermen.map((b) => {
                  const s = getStats(b.id);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-black text-xs">{b.name.charAt(0)}</span>
                          💈 {b.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.branch === "Telkom" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                          {b.branch || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {b.isActive ? <Badge variant="green">Aktif</Badge> : <Badge variant="red">Libur</Badge>}
                      </td>
                      <td className="py-2.5 px-4 text-center font-black text-slate-900">{s.customers}</td>
                      <td className="py-2.5 px-4 text-right font-black text-blue-700">{formatRupiah(s.omzet)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-xs">
                  <td className="py-2.5 px-4 text-blue-700 font-black" colSpan={3}>TOTAL GABUNGAN</td>
                  <td className="py-2.5 px-4 text-center font-black text-slate-900">{totalCust}</td>
                  <td className="py-2.5 px-4 text-right font-black text-blue-700">{formatRupiah(totalOmzet)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
          <span className="text-slate-400 mt-0.5">ℹ️</span>
          <span>Penugasan dan pengaturan aktif/libur barberman dilakukan oleh <strong>Admin Cabang</strong> masing-masing. Owner hanya memantau.</span>
        </div>
      </div>
    );
  };

  // ─── ADMIN VIEW: Operasional per Cabang ───────────────────────────
  const AdminView = () => {
    const activeHere = barbermen.filter((b) => b.isActive && b.branch === myBranch);
    const activeOther = barbermen.filter((b) => b.isActive && b.branch !== myBranch);
    const onLeave = barbermen.filter((b) => !b.isActive);

    const sortedBarbermen = [...barbermen].sort((a, b) => {
      const rank = (x: any) => { if (!x.isActive) return 3; if (x.branch === myBranch) return 0; return 1; };
      return rank(a) - rank(b);
    });

    return (
      <div className="space-y-4">
        {/* LEGEND */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold">
            <MapPin className="w-3 h-3" /> Bertugas di Sini: {activeHere.length}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold">
            <MapPin className="w-3 h-3" /> Di Cabang Lain: {activeOther.length}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-bold">
            <Coffee className="w-3 h-3" /> Libur: {onLeave.length}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBarbermen.map((b) => {
            const status = getStatus(b);
            const stats = getStats(b.id);
            const isLibur = status === "LIBUR";
            const isAtMyBranch = b.isActive && b.branch === myBranch;
            const isAtOtherBranch = b.isActive && b.branch !== myBranch;
            const isProcessing = togglingId === b.id;

            return (
              <Card key={b.id} className={`p-5 border shadow-sm transition-all ${isLibur ? "border-slate-200 bg-slate-50/60 opacity-70" : isAtMyBranch ? "border-blue-300 bg-white ring-1 ring-blue-100" : "border-amber-200 bg-amber-50/20"}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${isLibur ? "bg-slate-200 text-slate-400" : isAtMyBranch ? "bg-blue-600 text-white" : "bg-amber-400 text-white"}`}>
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{b.name}</h3>
                      <div className="text-[11px] text-slate-500">{b.nickname || "Professional Stylist"}</div>
                      {b.phone && <div className="text-[10px] text-slate-400">📞 {b.phone}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {isLibur && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1"><Coffee className="w-2.5 h-2.5"/>Libur</span>}
                    {isAtMyBranch && <Badge variant="green">Bertugas di Sini</Badge>}
                    {isAtOtherBranch && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1"><MapPin className="w-2.5 h-2.5"/>Di {b.branch}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs mb-4">
                  <div><div className="text-[9px] text-slate-400 uppercase font-bold">Customer</div><div className="font-bold text-slate-800 mt-0.5">{stats.customers}</div></div>
                  <div><div className="text-[9px] text-slate-400 uppercase font-bold">Transaksi</div><div className="font-bold text-slate-800 mt-0.5">{stats.transactions}</div></div>
                  <div><div className="text-[9px] text-slate-400 uppercase font-bold">Omzet</div><div className="font-black text-blue-700 mt-0.5 text-[10px]">{formatRupiah(stats.omzet)}</div></div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                  <div className="flex items-center gap-1.5">
                    {isProcessing && <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />}
                    {!isProcessing && !isAtMyBranch && (
                      <button onClick={() => handleAssignHere(b)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition">
                        <CheckCircle className="w-3 h-3" /> Tugaskan di Sini
                      </button>
                    )}
                    {!isProcessing && isAtMyBranch && (
                      <button onClick={() => handleSetLibur(b)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold hover:bg-amber-200 transition border border-amber-200">
                        <Coffee className="w-3 h-3" /> Tandai Libur
                      </button>
                    )}
                    <button onClick={() => openEditModal(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Link href="/laporan/barberman" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Kinerja
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <Scissors className="w-6 h-6 text-blue-600" />
            {isOwner ? "PEMANTAUAN BARBERMAN" : "DATA BARBERMAN"}
            {!isOwner && myBranch && myBranch !== "All" && (
              <span className="text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">📍 {myBranch}</span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOwner
              ? "Monitoring & perbandingan barberman antar Cabang Telkom dan Cabang Suta."
              : `Atur penugasan barberman untuk Cabang ${myBranch} hari ini.`}
          </p>
        </div>
        {isOwner && (
          <Button onClick={openAddModal} variant="outline" size="sm" className="border-slate-200">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Barberman
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Memuat data barberman...</p>
          </div>
        </div>
      ) : isOwner ? <OwnerView /> : <AdminView />}

      {/* MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Barberman" : "Tambah Barberman"} maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap <span className="text-rose-500">*</span></label>
            <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: Ade" className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Panggilan</label>
            <input type="text" value={formNickname} onChange={(e) => setFormNickname(e.target.value)} placeholder="Bang Ade" className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp</label>
            <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="081200001111" className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition" />
          </div>
          <Button type="submit" disabled={saving} variant="primary" className="w-full font-bold">
            {saving ? "Menyimpan..." : editId ? "Perbarui" : "Simpan"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
