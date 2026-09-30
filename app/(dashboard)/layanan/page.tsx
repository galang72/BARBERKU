"use client";

import React, { useState, useEffect } from "react";
import { Scissors, Plus, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatRupiah } from "@/lib/utils";

export default function LayananPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("HAIRCUT");
  const [price, setPrice] = useState(40000);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services?all=true");
      const json = await res.json();
      setServices(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setName("");
    setCategory("HAIRCUT");
    setPrice(40000);
    setDurationMinutes(30);
    setModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditId(s.id);
    setName(s.name);
    setCategory(s.category);
    setPrice(s.price);
    setDurationMinutes(s.durationMinutes);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      alert("Nama dan harga layanan wajib diisi!");
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await fetch("/api/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            name: name.trim(),
            category,
            price,
            durationMinutes,
          }),
        });
      } else {
        await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            category,
            price,
            durationMinutes,
          }),
        });
      }

      setModalOpen(false);
      fetchServices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, sName: string) => {
    if (confirm(`Yakin ingin menghapus layanan "${sName}"?`)) {
      try {
        await fetch(`/api/services?id=${id}`, { method: "DELETE" });
        fetchServices();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>KATALOG LAYANAN BARBERSHOP</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar harga potongan rambut, paket perawatan, hair spa, dan styling AD Barbershop.
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" size="sm" className="shadow-md shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-1.5" />
          + Tambah Layanan
        </Button>
      </div>

      {/* SERVICE TABLE */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Nama Layanan</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-center">Estimasi Durasi</th>
                <th className="py-3.5 px-4 text-right">Tarif / Harga</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs">Memuat daftar layanan...</p>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Scissors className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Belum ada layanan yang ditambahkan</p>
                  </td>
                </tr>
              ) : (
                services.map((s) => (
                  <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shadow-sm">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{s.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-600 font-medium">
                      ⏱ {s.durationMinutes} menit
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-700 text-base">
                      {formatRupiah(s.price)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={s.isActive ? "green" : "red"}>
                        {s.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          onClick={() => openEditModal(s)}
                          variant="outline"
                          size="sm"
                          className="text-xs p-1.5 border-slate-200 hover:bg-slate-50 text-slate-700"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(s.id, s.name)}
                          variant="ghost"
                          size="sm"
                          className="text-xs p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL TAMBAH / EDIT LAYANAN */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit Layanan" : "Tambah Layanan Baru"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Layanan <span className="text-rose-500 font-bold">* Wajib</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Premium Haircut & Wash"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
              >
                <option value="HAIRCUT">HAIRCUT</option>
                <option value="SHAVE">SHAVE</option>
                <option value="TREATMENT">TREATMENT</option>
                <option value="COLORING">COLORING</option>
                <option value="MASSAGE">MASSAGE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Durasi (Menit)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tarif / Harga (Rp) <span className="text-rose-500 font-bold">* Wajib</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="5000"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="40000"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-blue-700 font-black focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            variant="primary"
            className="w-full font-bold shadow-md shadow-blue-500/20"
          >
            {saving ? "Menyimpan..." : editId ? "Perbarui Layanan" : "Simpan Layanan"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
