"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  Wallet,
  Calculator,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatRupiah, formatDateTimeIndo } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";

export default function CashManagementPage() {
  const [cashData, setCashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Reconciliation state (Cash fisik vs Sistem)
  const [physicalCash, setPhysicalCash] = useState<number>(0);

  // Edit Float Modal State
  const [editFloatModalOpen, setEditFloatModalOpen] = useState(false);
  const [newFloatValue, setNewFloatValue] = useState<number>(100000);
  const [savingFloat, setSavingFloat] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<"CASH_IN" | "CASH_OUT">("CASH_IN");
  const [category, setCategory] = useState("Modal Masuk");
  const [amount, setAmount] = useState(100000);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCash = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cash");
      const json = await res.json();
      setCashData(json);
      setPhysicalCash(json.systemCash || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCash();
  }, []);

  const openCashInModal = () => {
    setEntryType("CASH_IN");
    setCategory("Modal Masuk");
    setAmount(100000);
    setDescription("");
    setModalOpen(true);
  };

  const openCashOutModal = () => {
    setEntryType("CASH_OUT");
    setCategory("Operasional Toko");
    setAmount(50000);
    setDescription("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !description.trim()) {
      alert("Harap lengkapi nominal dan keterangan!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: entryType,
          category,
          amount,
          description: description.trim(),
          source: "MANUAL",
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan transaksi kas");

      setModalOpen(false);
      fetchCash();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFloat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFloat(true);
    try {
      const res = await fetch("/api/cash", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialFloat: Number(newFloatValue) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengubah modal kas awal");
      setEditFloatModalOpen(false);
      fetchCash();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingFloat(false);
    }
  };

  const systemCash = cashData?.systemCash || 0;
  const selisih = physicalCash - systemCash;

  const handleExport = (type: "excel" | "csv") => {
    const list = cashData?.transactions || [];
    const formatted = list.map((c: any) => ({
      "Tipe": c.type === "CASH_IN" ? "Masuk" : "Keluar",
      "Kategori": c.category,
      "Nominal": c.amount,
      "Keterangan": c.description,
      "Sumber": c.source,
      "Waktu": formatDateTimeIndo(c.createdAt),
    }));
    if (type === "excel") exportToExcel(formatted, "Buku_Kas_AD_Barbershop");
    else exportToCSV(formatted, "Buku_Kas_AD_Barbershop");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>CASH MANAGEMENT (KAS LACI)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Buku kas tunai barbershop: Cash Masuk, Cash Keluar, rekonsiliasi laci fisik, dan selisih kas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleExport("excel")} variant="secondary" size="sm">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Excel
          </Button>
          <Button
            onClick={openCashInModal}
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20"
          >
            <ArrowDownLeft className="w-4 h-4 mr-1.5" />
            Cash In (+)
          </Button>
          <Button onClick={openCashOutModal} variant="danger" size="sm" className="font-bold">
            <ArrowUpRight className="w-4 h-4 mr-1.5" />
            Cash Out (-)
          </Button>
        </div>
      </div>

      {/* RUMUS & RINGKASAN CASH CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Modal Awal */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">Modal Kas Awal (Float)</div>
            <button
              onClick={() => {
                setNewFloatValue(cashData?.initialFloat ?? 100000);
                setEditFloatModalOpen(true);
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              Ubah
            </button>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatRupiah(cashData?.initialFloat ?? 100000)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Saldo buka laci harian</div>
        </Card>

        {/* Card 2: Cash In */}
        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Total Cash Masuk (In)</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatRupiah(cashData?.totalCashIn || 0)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Penjualan cash + setoran</div>
        </Card>

        {/* Card 3: Cash Out */}
        <Card className="p-4 border-rose-200 bg-rose-50/50">
          <div className="text-xs text-rose-700 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Total Cash Keluar (Out)</span>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {formatRupiah(cashData?.totalCashOut || 0)}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Operasional + beli stok</div>
        </Card>

        {/* Card 4: Cash Saat Ini (Sistem) */}
        <Card className="p-4 border-blue-200 bg-blue-50/70">
          <div className="text-xs text-blue-800 font-bold flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" />
            <span>CASH SAAT INI (SISTEM)</span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {formatRupiah(systemCash)}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Awal + Masuk - Keluar</div>
        </Card>
      </div>

      {/* REKONSILIASI KAS FISIK VS SISTEM */}
      <Card className="p-5 border-slate-200 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span>REKONSILIASI UANG FISIK KASIR</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Hitung uang fisik di laci kasir dan bandingkan dengan catatan pembukuan sistem.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-700 font-bold">Uang Fisik di Laci:</span>
            <input
              type="number"
              value={physicalCash}
              onChange={(e) => setPhysicalCash(Number(e.target.value) || 0)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-blue-300 text-right font-black text-blue-700 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 w-48"
            />
          </div>
        </div>

        {/* RECONCILIATION RESULT BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Cash Menurut Sistem</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{formatRupiah(systemCash)}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
            <div className="text-xs text-blue-800 font-medium">Cash Fisik di Laci</div>
            <div className="text-lg font-black text-blue-700 mt-0.5">{formatRupiah(physicalCash)}</div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border flex flex-col justify-center ${
              selisih === 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : selisih > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            <div className="text-xs font-bold">
              {selisih === 0 ? "Status: PAS (SEIMBANG)" : selisih > 0 ? "Surplus (Lebih)" : "Defisit (Kurang)"}
            </div>
            <div className="text-lg font-black mt-0.5">
              {selisih === 0 ? "Rp 0 (Cocok)" : formatRupiah(selisih)}
            </div>
          </div>
        </div>
      </Card>

      {/* CASH TRANSACTIONS LEDGER TABLE */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Riwayat Mutasi Buku Kas Laci
          </CardTitle>
          <span className="text-xs text-slate-400">
            {cashData?.transactions?.length || 0} catatan mutasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4 text-center">Tipe</th>
                <th className="py-3.5 px-4">Kategori Kas</th>
                <th className="py-3.5 px-4">Keterangan / Deskripsi</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat catatan buku kas...</span>
                    </div>
                  </td>
                </tr>
              ) : cashData?.transactions?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    Belum ada riwayat mutasi kas.
                  </td>
                </tr>
              ) : (
                cashData?.transactions?.map((c: any) => {
                  const isIn = c.type === "CASH_IN";
                  return (
                    <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                        {formatDateTimeIndo(c.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isIn ? "green" : "red"}>
                          {isIn ? "CASH IN (+)" : "CASH OUT (-)"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-xs">
                        {c.category}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {c.description}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-black text-sm ${
                          isIn ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isIn ? "+" : "-"}
                        {formatRupiah(c.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL INPUT CASH ENTRY */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={entryType === "CASH_IN" ? "Input Kas Masuk (Cash In)" : "Input Kas Keluar (Cash Out)"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {entryType === "CASH_IN" ? (
                <>
                  <option value="Modal Masuk">Modal Masuk / Kas Tambahan</option>
                  <option value="Penjualan Lainnya">Pendapatan Non-Kasir</option>
                  <option value="Setoran Lainnya">Setoran Lainnya</option>
                </>
              ) : (
                <>
                  <option value="Operasional Toko">Operasional Toko (Listrik, Air, Tisu, dll)</option>
                  <option value="Pembelian Stok">Pembelian / Restock Perlengkapan</option>
                  <option value="Pengambilan Uang">Pengambilan Uang / Prive</option>
                  <option value="Pengeluaran Lainnya">Pengeluaran Lainnya</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nominal (Rp) <span className="text-rose-500 font-bold">* Wajib</span>
            </label>
            <input
              type="number"
              required
              min="1000"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Rincian <span className="text-rose-500 font-bold">* Wajib</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Beli air galon aqua & sabun cuci"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            variant={entryType === "CASH_IN" ? "primary" : "danger"}
            className="w-full font-bold shadow-md"
          >
            {submitting ? "Menyimpan..." : entryType === "CASH_IN" ? "+ Simpan Kas Masuk" : "- Simpan Kas Keluar"}
          </Button>
        </form>
      </Modal>

      {/* MODAL ATUR MODAL KAS AWAL LACI (FLOAT) */}
      <Modal
        isOpen={editFloatModalOpen}
        onClose={() => setEditFloatModalOpen(false)}
        title="Atur Modal Kas Awal Laci (Float)"
      >
        <form onSubmit={handleSaveFloat} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Modal kas awal (float) adalah uang tunai pecahan yang disiapkan di dalam laci kasir saat toko dibuka untuk kembalian pelanggan. Anda dapat mengubahnya ke nominal berapapun.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nominal Kas Awal Laci (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              required
              value={newFloatValue}
              onChange={(e) => setNewFloatValue(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-blue-700 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Pilihan Cepat:</label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 100000, 200000, 500000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setNewFloatValue(val)}
                  className={`px-2 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    newFloatValue === val
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {val === 0 ? "Rp 0" : formatRupiah(val)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditFloatModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={savingFloat}
              className="font-bold shadow-md shadow-blue-500/25"
            >
              {savingFloat ? "Menyimpan..." : "Simpan Modal Awal"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
