"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeftRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatRupiah } from "@/lib/utils";

export default function BarbermanPage() {
  const [barbermen, setBarbermen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formNickname, setFormNickname] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isOwner = session?.role === "OWNER";

  const fetchBarbermen = async () => {
    setLoading(true);
    try {
      // API otomatis filter branch berdasarkan session
      // Owner → semua, Admin → hanya cabangnya
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

  useEffect(() => {
    fetchBarbermen();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setFormName("");
    setFormNickname("");
    setFormPhone("");
    setModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditId(b.id);
    setFormName(b.name);
    setFormNickname(b.nickname || "");
    setFormPhone(b.phone || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Nama barberman wajib diisi!");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: formName.trim(),
        nickname: formNickname.trim() || null,
        phone: formPhone.trim() || null,
      };
      if (editId) {
        await fetch("/api/barbermen", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
      } else {
        // Branch otomatis dari session di API
        await fetch("/api/barbermen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      fetchBarbermen();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (b: any) => {
    if (togglingId) return;
    setTogglingId(b.id);

    // Optimistic update
    setBarbermen((prev) =>
      prev.map((item) =>
        item.id === b.id ? { ...item, isActive: !item.isActive } : item
      )
    );

    try {
      const res = await fetch("/api/barbermen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, isActive: !b.isActive }),
      });
      if (!res.ok) {
        setBarbermen((prev) =>
          prev.map((item) =>
            item.id === b.id ? { ...item, isActive: b.isActive } : item
          )
        );
        const err = await res.json();
        alert("Gagal: " + (err.error || "Server error"));
      }
    } catch (e) {
      setBarbermen((prev) =>
        prev.map((item) =>
          item.id === b.id ? { ...item, isActive: b.isActive } : item
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Pindah cabang (hanya owner)
  const handleMoveBranch = async (b: any) => {
    const newBranch = b.branch === "Telkom" ? "Suta" : "Telkom";
    if (
      !confirm(
        `Pindahkan ${b.name} dari Cabang ${b.branch} ke Cabang ${newBranch}?\n\nBarberman akan otomatis dinonaktifkan di cabang lama.`
      )
    )
      return;

    setBarbermen((prev) =>
      prev.map((item) =>
        item.id === b.id ? { ...item, branch: newBranch } : item
      )
    );

    await fetch("/api/barbermen", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, branch: newBranch, isActive: true }),
    });
    fetchBarbermen();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data barberman "${name}"?`)) {
      try {
        await fetch(`/api/barbermen?id=${id}`, { method: "DELETE" });
        fetchBarbermen();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getStats = (barbermanId: string) => {
    const perf = dashboardStats?.barberPerformance?.find((p: any) => p.id === barbermanId);
    return perf || { customers: 0, transactions: 0, omzet: 0 };
  };

  // Filter tampilan: owner lihat semua, admin lihat sesuai cabangnya
  const filteredBarbermen = isOwner
    ? barbermen
    : barbermen.filter((b) => !session?.branch || b.branch === session.branch || !b.branch);

  // Owner: group by branch untuk tampilan lebih rapi
  const telkomList = filteredBarbermen.filter((b) => b.branch === "Telkom");
  const sutaList = filteredBarbermen.filter((b) => b.branch === "Suta");
  const otherList = filteredBarbermen.filter((b) => !b.branch);

  const renderCard = (b: any) => {
    const stats = getStats(b.id);
    return (
      <Card key={b.id} className={`p-5 border shadow-sm transition ${b.isActive ? "border-slate-200/80 bg-white" : "border-slate-200 bg-slate-50/60 opacity-75"}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shadow-sm ${b.isActive ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-500"}`}>
              {b.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{b.name}</h3>
              <div className="text-xs text-slate-500 font-medium">{b.nickname || "Professional Stylist"}</div>
              {b.phone && <div className="text-[11px] text-slate-400 mt-0.5">📞 {b.phone}</div>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={b.isActive ? "green" : "red"}>
              {b.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
            {b.branch && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                b.branch === "Telkom"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
              }`}>
                📍 {b.branch}
              </span>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Customer</div>
            <div className="font-bold text-slate-800 mt-0.5">{stats.customers}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Transaksi</div>
            <div className="font-bold text-slate-800 mt-0.5">{stats.transactions}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Omzet</div>
            <div className="font-black text-blue-700 mt-0.5">{formatRupiah(stats.omzet)}</div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEditModal(b)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToggleActive(b)}
              disabled={togglingId === b.id}
              className={`p-1.5 rounded-lg transition ${
                togglingId === b.id
                  ? "opacity-40 cursor-not-allowed"
                  : b.isActive
                  ? "text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                  : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
              title={b.isActive ? "Nonaktifkan" : "Aktifkan"}
            >
              {togglingId === b.id ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
              ) : b.isActive ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
            </button>
            {isOwner && (
              <button
                onClick={() => handleMoveBranch(b)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                title={`Pindah ke Cabang ${b.branch === "Telkom" ? "Suta" : "Telkom"}`}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(b.id, b.name)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/laporan/barberman"
            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline"
          >
            <span>Detail Kinerja</span>
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <Scissors className="w-6 h-6 text-blue-600" />
            <span>DATA BARBERMAN</span>
            {session?.branch && session.branch !== "All" && (
              <span className="text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                📍 Cabang {session.branch}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOwner
              ? "Owner — lihat semua 6 barberman dari Cabang Telkom & Suta. Gunakan ikon ⇄ untuk pindah cabang."
              : `Admin Cabang ${session?.branch} — barberman aktif di cabang Anda.`}
          </p>
        </div>
        <Button onClick={openAddModal} variant="primary" size="sm" className="shadow-md shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Barberman
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Memuat data barberman...</p>
          </div>
        </div>
      ) : isOwner ? (
        /* OWNER: tampilkan per cabang */
        <div className="space-y-6">
          {/* Cabang Telkom */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-black text-blue-700 uppercase tracking-wider">📍 Cabang Telkom</span>
              <span className="text-xs text-slate-400 font-medium">({telkomList.filter(b => b.isActive).length} aktif / {telkomList.length} total)</span>
            </div>
            {telkomList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Tidak ada barberman di Cabang Telkom.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {telkomList.map(renderCard)}
              </div>
            )}
          </div>

          {/* Cabang Suta */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-black text-indigo-700 uppercase tracking-wider">📍 Cabang Suta</span>
              <span className="text-xs text-slate-400 font-medium">({sutaList.filter(b => b.isActive).length} aktif / {sutaList.length} total)</span>
            </div>
            {sutaList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Tidak ada barberman di Cabang Suta.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sutaList.map(renderCard)}
              </div>
            )}
          </div>

          {otherList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherList.map(renderCard)}
            </div>
          )}
        </div>
      ) : (
        /* ADMIN: hanya tampilkan barberman aktif di cabangnya */
        <div>
          {filteredBarbermen.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Scissors className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-600">Belum ada barberman aktif di cabang ini</p>
              <p className="text-xs mt-1">Tambah barberman baru atau hubungi Owner untuk pindahkan barberman.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBarbermen.map(renderCard)}
            </div>
          )}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit Data Barberman" : "Tambah Barberman Baru"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap <span className="text-rose-500">* Wajib</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Ade"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Panggilan (Opsional)
            </label>
            <input
              type="text"
              value={formNickname}
              onChange={(e) => setFormNickname(e.target.value)}
              placeholder="Contoh: Bang Ade"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              No. WhatsApp (Opsional)
            </label>
            <input
              type="text"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="081200001111"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
          {!editId && (
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-700">
              💡 Barberman baru akan otomatis masuk ke <strong>Cabang {session?.branch || "Anda"}</strong>.
              Owner dapat memindahkan cabang kapan saja.
            </div>
          )}
          <Button type="submit" disabled={saving} variant="primary" className="w-full font-bold shadow-md shadow-blue-500/20">
            {saving ? "Menyimpan..." : editId ? "Perbarui Barberman" : "Simpan Barberman"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
