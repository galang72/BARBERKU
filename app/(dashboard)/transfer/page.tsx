"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArrowLeftRight,
  Plus,
  Package,
  CheckCircle2,
  Printer,
  FileSpreadsheet,
  Search,
  Building2,
  Calendar,
  User,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDateIndo, formatRupiah } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";

export default function TransferPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("ALL");
  const [user, setUser] = useState<any>(null);

  // New Transfer Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [fromBranch, setFromBranch] = useState("Cabang Telkom");
  const [toBranch, setToBranch] = useState("Cabang Suta");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(5);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products/transfer");
      const json = await res.json();
      setTransfers(json.transfers || []);
      setProducts(json.products || []);
      if (json.products?.length > 0 && !selectedProductId) {
        setSelectedProductId(json.products[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (data.user.role === "ADMIN_SUTA") {
            setFromBranch("Cabang Suta");
            setToBranch("Cabang Telkom");
          } else {
            setFromBranch("Cabang Telkom");
            setToBranch("Cabang Suta");
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleFromBranchChange = (branch: string) => {
    setFromBranch(branch);
    setToBranch(branch === "Cabang Telkom" ? "Cabang Suta" : "Cabang Telkom");
  };

  const handleOpenNewTransfer = () => {
    setFormError(null);
    setNotes("");
    setQuantity(5);
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
    setModalOpen(true);
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProductId) {
      setFormError("Pilih produk yang ingin ditransfer");
      return;
    }

    if (quantity <= 0) {
      setFormError("Jumlah transfer harus lebih dari 0");
      return;
    }

    if (selectedProduct && quantity > selectedProduct.stock) {
      setFormError(
        `Stok produk tidak mencukupi (Tersedia: ${selectedProduct.stock} ${selectedProduct.unit || "pcs"})`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/products/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          fromBranch,
          toBranch,
          quantity: Number(quantity),
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal membuat transfer");
      }

      setModalOpen(false);
      await fetchTransfers();
      // Open print slip preview for convenience
      setSelectedTransfer(json.transfer);
      setPrintModalOpen(true);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    const matchSearch =
      t.transferNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.productName?.toLowerCase().includes(search.toLowerCase()) ||
      t.productSku?.toLowerCase().includes(search.toLowerCase()) ||
      t.createdBy?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (routeFilter === "TLK_SUT") {
      return t.fromBranch?.includes("Telkom") && t.toBranch?.includes("Suta");
    }
    if (routeFilter === "SUT_TLK") {
      return t.fromBranch?.includes("Suta") && t.toBranch?.includes("Telkom");
    }
    return true;
  });

  const totalTransfers = transfers.length;
  const totalUnits = transfers.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const telkomToSutaCount = transfers.filter(
    (t) => t.fromBranch?.includes("Telkom") && t.toBranch?.includes("Suta")
  ).length;
  const sutaToTelkomCount = transfers.filter(
    (t) => t.fromBranch?.includes("Suta") && t.toBranch?.includes("Telkom")
  ).length;

  const handleExportExcel = () => {
    const formatted = filteredTransfers.map((t, idx) => ({
      No: idx + 1,
      "No. Transfer": t.transferNumber,
      Tanggal: formatDateIndo(new Date(t.createdAt)),
      "Cabang Asal": t.fromBranch,
      "Cabang Tujuan": t.toBranch,
      "SKU Produk": t.productSku,
      "Nama Produk": t.productName,
      Jumlah: `${t.quantity} ${t.unit || "pcs"}`,
      "Petugas / Admin": t.createdBy,
      Catatan: t.notes || "-",
      Status: t.status,
    }));
    exportToExcel(formatted, `Transfer_Produk_AD_Barbershop_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCSV = () => {
    const formatted = filteredTransfers.map((t, idx) => ({
      No: idx + 1,
      "No. Transfer": t.transferNumber,
      Tanggal: formatDateIndo(new Date(t.createdAt)),
      "Cabang Asal": t.fromBranch,
      "Cabang Tujuan": t.toBranch,
      "SKU Produk": t.productSku,
      "Nama Produk": t.productName,
      Jumlah: `${t.quantity} ${t.unit || "pcs"}`,
      "Petugas / Admin": t.createdBy,
      Catatan: t.notes || "-",
      Status: t.status,
    }));
    exportToCSV(formatted, `Transfer_Produk_AD_Barbershop_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Manajemen Stok Multi-Cabang</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            TRANSFER PRODUK ANTAR CABANG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fitur mutasi & perpindahan stok produk antar <strong>Cabang Telkom</strong> dan{" "}
            <strong>Cabang Suta</strong> secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransfers}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenNewTransfer}
            className="flex items-center gap-1.5 shadow-md shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Transfer Produk</span>
          </Button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-100 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Transaksi Transfer</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalTransfers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Surat jalan diterbitkan</div>
        </Card>

        <Card className="border-blue-100 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Produk Ditransfer</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600">{totalUnits}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total akumulasi kuantitas produk</div>
        </Card>

        <Card className="border-blue-100 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Telkom ➔ Suta</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{telkomToSutaCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pengiriman dari Cabang Telkom</div>
        </Card>

        <Card className="border-blue-100 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Suta ➔ Telkom</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">{sutaToTelkomCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pengiriman dari Cabang Suta</div>
        </Card>
      </div>

      {/* FILTER & SEARCH BAR */}
      <Card className="p-4 border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor surat, produk, atau admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
            />
          </div>

          {/* Route Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "Semua Rute" },
              { id: "TLK_SUT", label: "Telkom ➔ Suta" },
              { id: "SUT_TLK", label: "Suta ➔ Telkom" },
            ].map((rf) => (
              <button
                key={rf.id}
                onClick={() => setRouteFilter(rf.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  routeFilter === rf.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* TABLE DATA */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Riwayat Surat Jalan & Transfer Produk
            </h3>
            <span className="text-xs text-slate-400">({filteredTransfers.length} data)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">No. Transfer</th>
                <th className="py-3.5 px-4">Tanggal & Jam</th>
                <th className="py-3.5 px-4">Rute Cabang</th>
                <th className="py-3.5 px-4">Produk</th>
                <th className="py-3.5 px-4 text-center">Jumlah</th>
                <th className="py-3.5 px-4">Petugas</th>
                <th className="py-3.5 px-4">Catatan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat riwayat transfer produk...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada data transfer produk</p>
                      <p className="text-xs text-slate-400">
                        Klik tombol &ldquo;Buat Transfer Produk&rdquo; untuk mulai memindahkan stok.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => {
                  const isTlkToSut = t.fromBranch?.includes("Telkom");
                  return (
                    <tr key={t.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {t.transferNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="font-medium">{formatDateIndo(new Date(t.createdAt))}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(t.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isTlkToSut
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            {t.fromBranch}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isTlkToSut
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {t.toBranch}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{t.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          SKU: {t.productSku} • {t.categoryName || "Produk"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-sm text-blue-600">
                          {t.quantity}
                        </span>{" "}
                        <span className="text-[11px] text-slate-500 font-medium">
                          {t.unit || "pcs"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-500" />
                          <span>{t.createdBy}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-slate-500 truncate" title={t.notes}>
                        {t.notes || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTransfer(t);
                            setPrintModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600 mr-1" />
                          <span>Surat Jalan</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL BUAT TRANSFER PRODUK */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Formulir Transfer Produk Antar Cabang"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* RUTE CABANG */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Cabang Asal (Pengirim)
              </label>
              <select
                value={fromBranch}
                onChange={(e) => handleFromBranchChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="Cabang Telkom">🏢 Cabang Telkom</option>
                <option value="Cabang Suta">🏢 Cabang Suta</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Cabang Tujuan (Penerima)
              </label>
              <input
                type="text"
                disabled
                value={toBranch}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* PILIH PRODUK */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Pilih Produk
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock} {p.unit || "pcs"}) - {p.sku}
                </option>
              ))}
            </select>

            {selectedProduct && (
              <div className="mt-2 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Stok Tersedia di {fromBranch}:</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedProduct.stock} {selectedProduct.unit || "pcs"}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-medium">Harga Jual:</span>
                  <div className="font-bold text-blue-700 mt-0.5">
                    {formatRupiah(selectedProduct.sellingPrice)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* JUMLAH TRANSFER */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Jumlah Transfer ({selectedProduct?.unit || "pcs"})
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={selectedProduct ? selectedProduct.stock : 999}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                {selectedProduct?.unit || "pcs"}
              </span>
            </div>
            {selectedProduct && (
              <p className="text-[11px] text-slate-500 mt-1">
                Estimasi sisa stok di {fromBranch}:{" "}
                <strong className="text-slate-800">
                  {Math.max(0, selectedProduct.stock - quantity)} {selectedProduct.unit || "pcs"}
                </strong>
              </p>
            )}
          </div>

          {/* CATATAN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Keterangan / Alasan Transfer
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Permintaan stok darurat untuk display akhir pekan..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="shadow-md shadow-blue-500/25"
            >
              {submitting ? "Memproses..." : "Konfirmasi & Kirim Produk"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CETAK SURAT JALAN / BUKTI TRANSFER */}
      <Modal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Surat Jalan & Bukti Transfer Produk"
        maxWidth="max-w-2xl"
      >
        {selectedTransfer && (
          <div className="space-y-4">
            {/* PRINTABLE AREA */}
            <div id="transfer-slip-print" className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800 text-xs">
              {/* SLIP HEADER */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-blue-500 p-1 flex items-center justify-center">
                    <Image
                      src="/logo-ad-barbershop.png"
                      alt="AD Barbershop"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-wider">
                      AD BARBERSHOP
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Classic Grooming & Professional Haircut
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[10px] uppercase">
                    SURAT JALAN TRANSFER
                  </span>
                  <div className="font-mono font-bold text-xs text-slate-900 mt-1">
                    {selectedTransfer.transferNumber}
                  </div>
                </div>
              </div>

              {/* DETAILS METADATA */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-[11px]">
                <div>
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">
                    Cabang Pengirim (Asal):
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {selectedTransfer.fromBranch}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Admin Petugas: {selectedTransfer.createdBy}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">
                    Cabang Penerima (Tujuan):
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {selectedTransfer.toBranch}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Tanggal: {formatDateIndo(new Date(selectedTransfer.createdAt))}
                  </div>
                </div>
              </div>

              {/* ITEM TABLE */}
              <div className="py-4">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-[10px]">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Nama Produk</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-3 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-3">1</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {selectedTransfer.productSku}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {selectedTransfer.productName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {selectedTransfer.categoryName || "Produk"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-sm text-blue-600">
                        {selectedTransfer.quantity} {selectedTransfer.unit || "pcs"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* CATATAN */}
              {selectedTransfer.notes && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-[11px]">
                  <span className="font-bold text-slate-700">Catatan: </span>
                  <span className="text-slate-600">{selectedTransfer.notes}</span>
                </div>
              )}

              {/* TANDA TANGAN (SIGNATURE BLOCK) */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[10px] text-slate-600">
                <div>
                  <p className="font-semibold text-slate-500">Petugas Pengirim</p>
                  <div className="h-14"></div>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    ({selectedTransfer.createdBy})
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Petugas Penerima</p>
                  <div className="h-14"></div>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    (................................)
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Mengetahui (Owner)</p>
                  <div className="h-14"></div>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    (AD Barbershop Management)
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPrintModalOpen(false)}
              >
                Tutup
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Print Surat Jalan</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
