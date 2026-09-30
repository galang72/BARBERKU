"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scissors,
  Plus,
  Users,
  Receipt,
  TrendingUp,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
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

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formNickname, setFormNickname] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBarbermen = async () => {
    setLoading(true);
    try {
      const [resB, resDash] = await Promise.all([
        fetch("/api/barbermen?all=true"),
        fetch("/api/dashboard?filter=month"),
      ]);
      const dataB = await resB.json();
      const dataDash = await resDash.json();
      setBarbermen(dataB);
      setDashboardStats(dataDash);
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
      if (editId) {
        // Edit
        await fetch("/api/barbermen", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            name: formName.trim(),
            nickname: formNickname.trim() || null,
            phone: formPhone.trim() || null,
          }),
        });
      } else {
        // Create
        await fetch("/api/barbermen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            nickname: formNickname.trim() || null,
            phone: formPhone.trim() || null,
          }),
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

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleActive = async (b: any) => {
    if (togglingId) return; // hindari double-click
    setTogglingId(b.id);

    // Optimistic update: langsung ubah di state lokal
    setBarbermen((prev) =>
      prev.map((item) =>
        item.id === b.id ? { ...item, isActive: !item.isActive } : item
      )
    );

    try {
      const res = await fetch("/api/barbermen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: b.id,
          isActive: !b.isActive,
        }),
      });

      if (!res.ok) {
        // Rollback jika gagal
        setBarbermen((prev) =>
          prev.map((item) =>
            item.id === b.id ? { ...item, isActive: b.isActive } : item
          )
        );
        const err = await res.json();
        alert("Gagal mengubah status: " + (err.error || "Server error"));
      }
    } catch (e) {
      // Rollback jika network error
      setBarbermen((prev) =>
        prev.map((item) =>
          item.id === b.id ? { ...item, isActive: b.isActive } : item
        )
      );
      console.error(e);
    } finally {
      setTogglingId(null);
    }
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

  // Get performance stats for barberman from dashboard stats
  const getStats = (barbermanId: string) => {
    const list = dashboardStats?.barberPerformance || [];
    const found = list.find((item: any) => item.id === barbermanId);
    return (
      found || {
        customers: 0,
        transactions: 0,
        omzet: 0,
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>TIM BARBERMAN AD BARBERSHOP</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data barberman (Arie, Azis, Dani), produktivitas potong, omzet, dan status bertugas.
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" size="sm" className="shadow-md shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-1.5" />
          + Tambah Barberman
        </Button>
      </div>

      {/* BARBERMAN CARDS GRID */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs">Memuat data tim barberman...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {barbermen.map((b) => {
            const stats = getStats(b.id);
            return (
              <Card
                key={b.id}
                className={`relative overflow-hidden transition bg-white border-slate-200/80 shadow-sm hover:shadow-md ${
                  b.isActive ? "border-slate-200" : "opacity-60 border-rose-200"
                }`}
              >
                {/* Header Barberman */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white font-black flex items-center justify-center text-lg shadow-md shadow-blue-500/30">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{b.name}</h3>
                      <div className="text-xs text-slate-500 font-medium">{b.nickname || "Professional Stylist"}</div>
                      {b.phone && <div className="text-[11px] text-slate-400 mt-0.5">📞 {b.phone}</div>}
                    </div>
                  </div>

                  <Badge variant={b.isActive ? "green" : "red"}>
                  {b.isActive ? "Aktif" : "Nonaktif"}
                   </Badge>
                </div>

                {/* STATS ROW (BULAN INI) */}
                <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs">
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

                {/* ACTION BUTTONS */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                      title="Edit Data"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(b)}
                      disabled={togglingId === b.id}
                      className={`p-1.5 rounded-lg transition ${
                        togglingId === b.id
                          ? "opacity-50 cursor-not-allowed"
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
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    href={`/laporan/barberman`}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>Detail Kinerja</span>
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT BARBERMAN */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit Data Barberman" : "Tambah Barberman Baru"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Barberman <span className="text-rose-500 font-bold">* Wajib</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Arie"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Panggilan / Nickname (Opsional)
            </label>
            <input
              type="text"
              value={formNickname}
              onChange={(e) => setFormNickname(e.target.value)}
              placeholder="Contoh: Bang Arie"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor WhatsApp / HP (Opsional)
            </label>
            <input
              type="text"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="Contoh: 081211112222"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            variant="primary"
            className="w-full font-bold shadow-md shadow-blue-500/20"
          >
            {saving ? "Menyimpan..." : editId ? "Perbarui Barberman" : "Simpan Barberman"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
