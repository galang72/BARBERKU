"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Search,
  FileSpreadsheet,
  Edit2,
  RefreshCw,
  Archive,
  ArrowLeftRight,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatRupiah } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";

export default function ProdukPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Add Product Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [supplier, setSupplier] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [savingProduct, setSavingProduct] = useState(false);

  // Stock Adjustment Modal
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState("Restock Supplier");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [submittingStock, setSubmittingStock] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?includeCategories=true");
      const json = await res.json();
      setProducts(json.products || []);
      setCategories(json.categories || []);
      if (json.categories?.length > 0 && !categoryId) {
        setCategoryId(json.categories[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setName("");
    setCostPrice(30000);
    setSellingPrice(50000);
    setStock(10);
    setMinStock(5);
    setSupplier("");
    setUnit("pcs");
    setAddModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditId(p.id);
    setSku(p.sku);
    setName(p.name);
    setCategoryId(p.categoryId || "");
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setSupplier(p.supplier || "");
    setUnit(p.unit || "pcs");
    setAddModalOpen(true);
  };

  const openStockModal = (p: any) => {
    setSelectedProduct(p);
    setAdjustType("IN");
    setAdjustQty(10);
    setAdjustReason("Restock Supplier");
    setAdjustNotes("");
    setStockModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !sellingPrice) {
      alert("Harap lengkapi nama produk, SKU, dan harga jual!");
      return;
    }

    setSavingProduct(true);
    try {
      if (editId) {
        await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            sku,
            name,
            categoryId,
            costPrice,
            sellingPrice,
            stock,
            minStock,
            supplier,
            unit,
          }),
        });
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku,
            name,
            categoryId,
            costPrice,
            sellingPrice,
            stock,
            minStock,
            supplier,
            unit,
          }),
        });
      }
      setAddModalOpen(false);
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan data produk.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustQty || adjustQty <= 0) {
      alert("Harap masukkan kuantitas mutasi yang valid!");
      return;
    }

    setSubmittingStock(true);
    try {
      const res = await fetch("/api/products/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: adjustType,
          quantity: adjustQty,
          reason: adjustReason,
          notes: adjustNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mutasi stok");
      }

      setStockModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Gagal menyesuaikan stok produk.");
    } finally {
      setSubmittingStock(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleExport = (type: "excel" | "csv") => {
    const formatted = filtered.map((p) => ({
      "SKU": p.sku,
      "Nama Produk": p.name,
      "Kategori": p.category?.name || "-",
      "Harga Modal": p.costPrice,
      "Harga Jual": p.sellingPrice,
      "Estimasi Margin": p.sellingPrice - p.costPrice,
      "Sisa Stok": p.stock,
      "Min. Stok": p.minStock,
      "Satuan": p.unit,
      "Supplier": p.supplier || "-",
    }));
    if (type === "excel") exportToExcel(formatted, "Inventaris_Produk_AD_Barbershop");
    else exportToCSV(formatted, "Inventaris_Produk_AD_Barbershop");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>INVENTARIS PRODUK & STOK</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola stok pomade, tonic, powder, shampoo, harga modal, harga jual, dan transfer antar cabang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Transfer Antar Cabang Button */}
          <Link href="/transfer">
            <Button
              variant="secondary"
              size="sm"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 flex items-center gap-1.5 font-bold"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Transfer Antar Cabang</span>
            </Button>
          </Link>
          <Button onClick={() => handleExport("excel")} variant="secondary" size="sm">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Excel
          </Button>
          <Button onClick={openAddModal} variant="primary" size="sm" className="shadow-md shadow-blue-500/25">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <Card className="p-4 border-slate-200 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama produk atau kode SKU..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Kategori ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === c.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Card>

      {/* PRODUCTS TABLE */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">SKU / Nama Produk</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Modal (COGS)</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-right">Laba / Margin</th>
                <th className="py-3.5 px-4 text-center">Sisa Stok</th>
                <th className="py-3.5 px-4 text-center">Aksi / Mutasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat katalog produk...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada produk pada kategori ini.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  const profit = p.sellingPrice - p.costPrice;
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-slate-900 font-bold">{p.name}</div>
                            <div className="text-[11px] font-mono text-slate-400 font-normal">
                              SKU: {p.sku} {p.supplier ? `• ${p.supplier}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[11px]">
                          {p.category?.name || "Lainnya"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-medium">
                        {formatRupiah(p.costPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-blue-700 text-sm">
                        {formatRupiah(p.sellingPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 text-xs">
                        +{formatRupiah(profit)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isLow
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          <span>{p.stock} {p.unit}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            onClick={() => openStockModal(p)}
                            variant="primary"
                            size="sm"
                            className="text-xs py-1 px-2.5 font-bold shadow-sm"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Mutasi
                          </Button>
                          <Button
                            onClick={() => openEditModal(p)}
                            variant="secondary"
                            size="sm"
                            className="text-xs p-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          </Button>
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

      {/* MODAL MUTASI STOK */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={`Mutasi Stok: ${selectedProduct?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4">
          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Stok Saat Ini:</span>
            <span className="font-extrabold text-blue-700 text-sm">
              {selectedProduct?.stock} {selectedProduct?.unit}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Jenis Mutasi Stok
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAdjustType("IN");
                  setAdjustReason("Restock Supplier");
                }}
                className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  adjustType === "IN"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Masuk (IN)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustType("OUT");
                  setAdjustReason("Barang Rusak / Kadaluarsa");
                }}
                className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  adjustType === "OUT"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Keluar (OUT)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustType("ADJUSTMENT");
                  setAdjustReason("Hasil Stock Opname Fisik");
                }}
                className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  adjustType === "ADJUSTMENT"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span>Audit Opname</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {adjustType === "ADJUSTMENT" ? "Set Total Stok Baru Menjadi:" : "Jumlah Unit:"}
            </label>
            <input
              type="number"
              required
              min="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alasan / Kategori Mutasi
            </label>
            <input
              type="text"
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Contoh: Restock Supplier PT Grooming"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="No faktur penerimaan barang dll"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <Button
            type="submit"
            disabled={submittingStock}
            variant="primary"
            className="w-full font-bold shadow-md shadow-blue-500/25"
          >
            {submittingStock ? "Menyimpan Mutasi..." : "Simpan Mutasi Stok"}
          </Button>
        </form>
      </Modal>

      {/* MODAL TAMBAH / EDIT PRODUK */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={editId ? "Edit Data Produk" : "Tambah Produk Baru"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode SKU <span className="text-rose-500 font-bold">* Wajib</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="POM-SUV-01"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Produk
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Produk <span className="text-rose-500 font-bold">* Wajib</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Suavecito Matte Pomade 4oz"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Modal (COGS)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Jual Kasir <span className="text-rose-500 font-bold">* Wajib</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-blue-700 font-black focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stok Awal
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Min. Stok
              </label>
              <input
                type="number"
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Satuan
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pot / botol / pcs"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Supplier / Distributor (Opsional)
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Contoh: PT Grooming Supply Indonesia"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <Button
            type="submit"
            disabled={savingProduct}
            variant="primary"
            className="w-full font-bold shadow-md shadow-blue-500/25"
          >
            {savingProduct ? "Menyimpan..." : editId ? "Perbarui Data Produk" : "Simpan Produk Baru"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
