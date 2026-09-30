"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Plus,
  RotateCw,
  FileSpreadsheet,
  Users,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";

export default function MemberPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal Registrasi Member
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [packageName, setPackageName] = useState("VIP 6 Bulan");
  const [durationDays, setDurationDays] = useState(180);
  const [saving, setSaving] = useState(false);

  // Extend Modal
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [extendDays, setExtendDays] = useState(30);

  const fetchMembers = async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/members?q=${encodeURIComponent(q)}` : "/api/members";
      const res = await fetch(url);
      const json = await res.json();
      setMembers(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(search);
  }, [search]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama member wajib diisi!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          packageName,
          durationDays,
        }),
      });

      if (!res.ok) throw new Error("Gagal membuat member");

      setAddModalOpen(false);
      setName("");
      setPhone("");
      fetchMembers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMember.id,
          additionalDays: extendDays,
        }),
      });
      if (res.ok) {
        setExtendModalOpen(false);
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus member "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/members?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMembers();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus member");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = (type: "excel" | "csv") => {
    const formatted = members.map((m) => ({
      "ID Member": m.memberCode,
      "Nama Member": m.name,
      "No. Telepon": m.phone || "-",
      "Paket": m.packageName,
      "Masa Berlaku": formatDateIndo(m.endDate),
      "Status": m.status,
      "Total Kunjungan": m.totalVisits,
      "Total Pengeluaran": m.totalSpend,
    }));
    if (type === "excel") exportToExcel(formatted, "Daftar_Member_AD_Barbershop");
    else exportToCSV(formatted, "Daftar_Member_AD_Barbershop");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>MEMBERSHIP AD BARBERSHOP</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen keanggotaan loyal, masa aktif paket, perpanjangan, dan riwayat kunjungan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleExport("excel")} variant="outline" size="sm" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Excel
          </Button>
          <Button onClick={() => setAddModalOpen(true)} variant="primary" size="sm" className="shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-1.5" />
            + Tambah Member
          </Button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <Card className="p-4 border-slate-200/80 shadow-sm bg-white">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan ID Member (AD-MBR-xxx), Nama, atau Nomor HP..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>
      </Card>

      {/* MEMBER TABLE */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">ID Member</th>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Paket Membership</th>
                <th className="py-3.5 px-4">Masa Berlaku</th>
                <th className="py-3.5 px-4 text-center">Kunjungan</th>
                <th className="py-3.5 px-4 text-right">Total Belanja</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs">Memuat data member...</p>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ditemukan member dengan kata kunci tersebut</p>
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isExpired = new Date(m.endDate) < new Date();
                  return (
                    <tr key={m.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 text-xs">
                        {m.memberCode}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{m.name}</div>
                        {m.phone && <div className="text-xs text-slate-500 font-normal">📞 {m.phone}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {m.packageName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDateIndo(m.endDate)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold">
                          {m.totalVisits}x
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-blue-700">
                        {formatRupiah(m.totalSpend)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isExpired ? (
                          <Badge variant="red">Expired</Badge>
                        ) : (
                          <Badge variant="green">Aktif</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => {
                              setSelectedMember(m);
                              setExtendModalOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <RotateCw className="w-3.5 h-3.5 mr-1 text-blue-600" />
                            Perpanjang
                          </Button>
                          <button
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"
                            title="Hapus member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL REGISTRASI MEMBER */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Daftarkan Member Baru"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Member <span className="text-rose-500 font-bold">* Wajib</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kevin Sanjaya"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor WhatsApp / HP
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Paket Membership
            </label>
            <select
              value={packageName}
              onChange={(e) => {
                setPackageName(e.target.value);
                if (e.target.value.includes("1 Bulan")) setDurationDays(30);
                else if (e.target.value.includes("3 Bulan")) setDurationDays(90);
                else if (e.target.value.includes("6 Bulan")) setDurationDays(180);
                else if (e.target.value.includes("1 Tahun")) setDurationDays(365);
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
            >
              <option value="Silver 1 Bulan (30 Hari)">Silver 1 Bulan (30 Hari)</option>
              <option value="Gold 3 Bulan (90 Hari)">Gold 3 Bulan (90 Hari)</option>
              <option value="VIP 6 Bulan (180 Hari)">VIP 6 Bulan (180 Hari)</option>
              <option value="Platinum 1 Tahun (365 Hari)">Platinum 1 Tahun (365 Hari)</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={saving}
            variant="primary"
            className="w-full font-bold shadow-md shadow-blue-500/20"
          >
            {saving ? "Mendaftarkan..." : "Aktifkan Membership"}
          </Button>
        </form>
      </Modal>

      {/* MODAL PERPANJANG MEMBER */}
      <Modal
        isOpen={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        title={`Perpanjang Member: ${selectedMember?.name}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleExtendSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tambah Masa Berlaku
            </label>
            <select
              value={extendDays}
              onChange={(e) => setExtendDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
            >
              <option value={30}>+ 1 Bulan (30 Hari)</option>
              <option value={90}>+ 3 Bulan (90 Hari)</option>
              <option value={180}>+ 6 Bulan (180 Hari)</option>
              <option value={365}>+ 1 Tahun (365 Hari)</option>
            </select>
          </div>

          <Button type="submit" variant="primary" className="w-full font-bold shadow-md shadow-blue-500/20">
            Konfirmasi Perpanjangan
          </Button>
        </form>
      </Modal>
    </div>
  );
}
