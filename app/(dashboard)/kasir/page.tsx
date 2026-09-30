"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  UserPlus,
  Scissors,
  Package,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  QrCode,
  CreditCard,
  Send,
  CheckCircle2,
  ArrowRight,
  User,
  Phone,
  Instagram,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ReceiptModal } from "@/components/kasir/receipt-modal";
import { formatRupiah } from "@/lib/utils";

export default function KasirPage() {
  // Master data
  const [barbermen, setBarbermen] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [shopSettings, setShopSettings] = useState<any>(null);

  // Active Category filter in item list ("all", "HAIRCUT", "cat_pomade", etc.)
  const [activeItemTab, setActiveItemTab] = useState<string>("ALL");
  const [searchItem, setSearchItem] = useState("");

  // Customer State (Wajib Nama, Opsional Phone & Instagram)
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  // Ref untuk menutup dropdown saat klik di luar
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Selected Customer (can be existing or new input)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerInstagram, setNewCustomerInstagram] = useState("");

  // Transaction State
  const [selectedBarbermanId, setSelectedBarbermanId] = useState<string>("");
  const [cart, setCart] = useState<any[]>([]);
  const [discountType, setDiscountType] = useState<"nominal" | "percent">("nominal");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Checkout Status & Receipt Modal
  const [submitting, setSubmitting] = useState(false);
  const [completedTx, setCompletedTx] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Tutup dropdown autocomplete saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial master data
  const loadMasterData = async () => {
    try {
      const [resB, resS, resP, resSettings, resSess] = await Promise.all([
        fetch("/api/barbermen?all=true"),
        fetch("/api/services"),
        fetch("/api/products?includeCategories=true"),
        fetch("/api/settings"),
        fetch("/api/auth/me"),
      ]);

      const dataB = await resB.json();
      const dataS = await resS.json();
      const dataP = await resP.json();
      const dataSet = await resSettings.json();
      const dataSess = await resSess.json();

      // Filter: hanya barberman yang isActive=true DAN branch = cabang admin yang login
      const myBranch = dataSess?.branch;
      const filteredBarbermen = Array.isArray(dataB)
        ? dataB.filter((b: any) => {
            if (!b.isActive) return false;
            // Jika admin punya cabang spesifik, filter sesuai
            if (myBranch && myBranch !== "All") return b.branch === myBranch;
            return true; // Owner: lihat semua aktif
          })
        : [];

      setBarbermen(filteredBarbermen);
      if (filteredBarbermen.length > 0 && !selectedBarbermanId) {
        setSelectedBarbermanId(filteredBarbermen[0].id);
      }

      setServices(dataS);
      setProducts(dataP.products || []);
      setCategories(dataP.categories || []);
      setShopSettings(dataSet);
    } catch (err) {
      console.error("Failed to load cashier data", err);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Search customers debounced
  useEffect(() => {
    if (!customerSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const res = await fetch(`/api/customers?query=${encodeURIComponent(customerSearchQuery)}`);
        const json = await res.json();
        setSearchResults(json);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingCustomer(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  // Cart operations
  const addToCart = (item: any, itemType: "SERVICE" | "PRODUCT") => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.itemType === itemType && (itemType === "SERVICE" ? it.serviceId === item.id : it.productId === item.id)
      );

      if (existingIdx !== -1) {
        const updated = [...prev];
        const nextQty = updated[existingIdx].quantity + 1;

        if (itemType === "PRODUCT" && item.stock && nextQty > item.stock) {
          alert(`Stok produk "${item.name}" tersisa ${item.stock}!`);
          return prev;
        }

        updated[existingIdx].quantity = nextQty;
        updated[existingIdx].subtotal = nextQty * updated[existingIdx].price;
        return updated;
      } else {
        const price = itemType === "SERVICE" ? item.price : item.sellingPrice;
        const costPrice = itemType === "SERVICE" ? 0 : item.costPrice || 0;

        if (itemType === "PRODUCT" && item.stock <= 0) {
          alert(`Stok produk "${item.name}" habis!`);
          return prev;
        }

        return [
          ...prev,
          {
            itemType,
            serviceId: itemType === "SERVICE" ? item.id : null,
            productId: itemType === "PRODUCT" ? item.id : null,
            name: item.name,
            price,
            costPrice,
            quantity: 1,
            subtotal: price,
            maxStock: itemType === "PRODUCT" ? item.stock : undefined,
          },
        ];
      }
    });
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const nextQty = updated[idx].quantity + delta;

      if (nextQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }

      if (updated[idx].itemType === "PRODUCT" && updated[idx].maxStock && nextQty > updated[idx].maxStock) {
        alert(`Maksimal stok tersedia hanya ${updated[idx].maxStock}!`);
        return prev;
      }

      updated[idx].quantity = nextQty;
      updated[idx].subtotal = nextQty * updated[idx].price;
      return updated;
    });
  };

  const removeFromCart = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  // Subtotal & Calculations
  const subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);

  const discountAmount =
    discountType === "percent"
      ? Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100)
      : Math.min(subtotal, Math.max(0, discountValue));

  const grandTotal = Math.max(0, subtotal - discountAmount);
  const changeAmount = paymentMethod === "CASH" ? Math.max(0, amountPaid - grandTotal) : 0;

  // Set default amount paid when grandTotal changes
  useEffect(() => {
    if (paymentMethod === "CASH") {
      setAmountPaid(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  // Handle Customer Selection
  const handleSelectExistingCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    setNewCustomerName(cust.name);
    setNewCustomerPhone(cust.phone || "");
    setNewCustomerInstagram(cust.instagram || "");
    setSearchResults([]);
    setCustomerSearchQuery("");
    setCustomerModalOpen(false);
  };

  const handleSaveNewCustomer = () => {
    if (!newCustomerName.trim()) {
      alert("Nama Customer wajib diisi!");
      return;
    }
    setSelectedCustomer({
      id: null,
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || null,
      instagram: newCustomerInstagram.trim() || null,
      totalVisits: 0,
    });
    setCustomerModalOpen(false);
  };

  // Submit Checkout
  const handleCheckout = async () => {
    if (!selectedBarbermanId) {
      alert("Pilih Barberman yang bertugas!");
      return;
    }

    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }

    const customerName = selectedCustomer ? selectedCustomer.name : newCustomerName;
    if (!customerName || !customerName.trim()) {
      alert("Nama customer wajib diisi untuk transaksi!");
      return;
    }

    if (paymentMethod === "CASH" && amountPaid < grandTotal) {
      alert(`Uang diterima (${formatRupiah(amountPaid)}) kurang dari total bayar (${formatRupiah(grandTotal)})!`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer?.id || null,
        customerName: customerName.trim(),
        customerPhone: selectedCustomer?.phone || newCustomerPhone.trim() || null,
        customerInstagram: selectedCustomer?.instagram || newCustomerInstagram.trim() || null,
        barbermanId: selectedBarbermanId,
        items: cart,
        subtotal,
        discount: discountAmount,
        grandTotal,
        paymentMethod,
        amountPaid: paymentMethod === "CASH" ? amountPaid : grandTotal,
        changeAmount,
        notes,
      };

      const res = await fetch("/api/kasir/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal memproses transaksi kasir");
      }

      setCompletedTx(json.transaction);
      setReceiptOpen(true);

      setCart([]);
      setSelectedCustomer(null);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerInstagram("");
      setDiscountValue(0);
      setNotes("");

      loadMasterData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Catalog Items
  const filteredServices = services.filter((s) => {
    if (activeItemTab !== "ALL" && activeItemTab !== "SERVICE" && s.category !== activeItemTab) return false;
    if (searchItem && !s.name.toLowerCase().includes(searchItem.toLowerCase())) return false;
    return true;
  });

  const filteredProducts = products.filter((p) => {
    if (activeItemTab !== "ALL" && activeItemTab !== "PRODUCT" && p.categoryId !== activeItemTab) return false;
    if (searchItem && !p.name.toLowerCase().includes(searchItem.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* RECEIPT MODAL */}
      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        transaction={completedTx}
        settings={shopSettings}
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>KASIR POINT OF SALE</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] bg-blue-600 text-white font-extrabold shadow-sm">
              POS
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Transaksi cepat walk-in, pemilihan barberman, potong rambut, dan produk grooming.
          </p>
        </div>

        {/* Selected Barberman Shortcut */}
        <div className="flex items-center gap-2 bg-white p-1.5 px-3 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Barberman Bertugas:</span>
          <select
            value={selectedBarbermanId}
            onChange={(e) => setSelectedBarbermanId(e.target.value)}
            className="bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            {barbermen.map((b) => (
              <option key={b.id} value={b.id}>
                💈 {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN LAYOUT: LEFT CATALOG (60%), RIGHT CART & BILLING (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: ITEM CATALOG (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* SEARCH & CATEGORY FILTER TABS */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                placeholder="Cari layanan potong, pomade, tonic..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition shadow-sm"
              />
            </div>

            {/* Quick Reload Master */}
            <button
              onClick={loadMasterData}
              title="Refresh Data"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* TABS */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            <button
              onClick={() => setActiveItemTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeItemTab === "ALL"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Semua Menu
            </button>
            <button
              onClick={() => setActiveItemTab("SERVICE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeItemTab === "SERVICE"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              ✂️ Layanan Potong
            </button>
            <button
              onClick={() => setActiveItemTab("PRODUCT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeItemTab === "PRODUCT"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              📦 Produk
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveItemTab(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeItemTab === c.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* CATALOG GRID */}
          <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
            {/* SERVICES SECTION */}
            {(activeItemTab === "ALL" || activeItemTab === "SERVICE") && filteredServices.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-blue-600" />
                  <span>Daftar Layanan Barbershop</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredServices.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => addToCart(srv, "SERVICE")}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 cursor-pointer transition flex flex-col justify-between group active:scale-[0.98] shadow-sm"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition leading-snug">
                          {srv.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          ⏱ {srv.durationMinutes} menit
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-extrabold text-blue-700 text-xs sm:text-sm">
                          {formatRupiah(srv.price)}
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition">
                          +
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCTS SECTION */}
            {(activeItemTab === "ALL" || activeItemTab === "PRODUCT" || activeItemTab.startsWith("cat_")) && filteredProducts.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Produk Grooming & Pomade</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredProducts.map((prod) => {
                    const isOutOfStock = prod.stock <= 0;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => !isOutOfStock && addToCart(prod, "PRODUCT")}
                        className={`p-3.5 rounded-2xl border transition flex flex-col justify-between group shadow-sm ${
                          isOutOfStock
                            ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                            : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 cursor-pointer active:scale-[0.98]"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition leading-snug">
                            {prod.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                prod.stock <= prod.minStock
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              Stok: {prod.stock} {prod.unit}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-extrabold text-blue-700 text-xs sm:text-sm">
                            {formatRupiah(prod.sellingPrice)}
                          </span>
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isOutOfStock
                                ? "bg-slate-200 text-slate-400"
                                : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition"
                            }`}
                          >
                            +
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER & CART BILLING (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 p-4 space-y-4 bg-white shadow-md">
            {/* 1. CUSTOMER SELECTOR / INPUT */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customer</span>
                </span>
                <button
                  onClick={() => setCustomerModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Pilih / Baru</span>
                </button>
              </div>

              {/* Display Current Customer */}
              {selectedCustomer ? (
                <div className="p-2.5 rounded-xl bg-white border border-blue-200 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{selectedCustomer.name}</span>
                      {selectedCustomer.totalVisits > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          {selectedCustomer.totalVisits}x kunjungan
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                      {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                      {selectedCustomer.instagram && (
                        <span className="text-pink-600 font-medium">📷 {selectedCustomer.instagram}</span>
                      )}
                      {!selectedCustomer.phone && !selectedCustomer.instagram && (
                        <span className="text-slate-400 italic">Nama saja (Walk-in)</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      setNewCustomerName("");
                      setNewCustomerPhone("");
                      setNewCustomerInstagram("");
                      setSearchResults([]);
                      setCustomerSearchQuery("");
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 text-base font-bold cursor-pointer"
                    title="Hapus / Ganti Customer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* ── AUTOCOMPLETE CUSTOMER NAME ── */}
                  <div className="relative" ref={autocompleteRef}>
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => {
                        setNewCustomerName(e.target.value);
                        setCustomerSearchQuery(e.target.value);
                      }}
                      onFocus={() => {
                        if (newCustomerName.trim()) setCustomerSearchQuery(newCustomerName);
                      }}
                      placeholder="Nama Customer (Wajib) * — ketik untuk cari"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                      autoComplete="off"
                    />
                    {/* Loading indicator */}
                    {searchingCustomer && (
                      <div className="absolute right-3 top-2.5">
                        <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {/* Dropdown Autocomplete */}
                    {searchResults.length > 0 && newCustomerName.trim() && !selectedCustomer && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-blue-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                        <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            {searchResults.length} customer ditemukan
                          </span>
                        </div>
                        {searchResults.map((cust: any) => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => {
                              handleSelectExistingCustomer(cust);
                              setCustomerSearchQuery("");
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition border-b border-slate-50 last:border-0"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                  {cust.name}
                                  {cust.totalVisits > 0 && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                      {cust.totalVisits}x
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                  {cust.phone && <span>📞 {cust.phone}</span>}
                                  {cust.instagram && <span className="text-pink-500">📷 {cust.instagram}</span>}
                                  {!cust.phone && !cust.instagram && <span className="italic">Walk-in</span>}
                                </div>
                              </div>
                              {cust.totalSpend > 0 && (
                                <div className="text-right shrink-0">
                                  <div className="text-[10px] font-black text-blue-700">
                                    {formatRupiah(cust.totalSpend)}
                                  </div>
                                  <div className="text-[9px] text-slate-400">total belanja</div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                        {/* Opsi: buat baru dengan nama yang diketik */}
                        <button
                          type="button"
                          onClick={() => {
                            setSearchResults([]);
                            setCustomerSearchQuery("");
                          }}
                          className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 transition text-[10px] text-slate-500 font-semibold flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3 h-3" />
                          Buat customer baru "{newCustomerName}"
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="No. HP (Opsional)"
                      className="w-1/2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                    <input
                      type="text"
                      value={newCustomerInstagram}
                      onChange={(e) => setNewCustomerInstagram(e.target.value)}
                      placeholder="Instagram (Opsional)"
                      className="w-1/2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    * Ketik nama untuk cari customer lama. No. HP & Instagram boleh dikosongkan.
                  </div>
                </div>
              )}
            </div>

            {/* 2. CART ITEMS LIST */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100">
                <span>Item Transaksi ({cart.length})</span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-rose-600 hover:underline text-[11px] font-semibold cursor-pointer"
                  >
                    kosongkan
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Keranjang masih kosong. Klik layanan atau produk di katalog sebelah kiri.
                </div>
              ) : (
                <div className="max-h-[190px] overflow-y-auto space-y-2 pr-1">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-slate-900 leading-tight">{item.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatRupiah(item.price)}
                        </div>
                      </div>

                      {/* QTY CONTROLS */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQty(idx, -1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold border border-slate-200 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-slate-900 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(idx, 1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold border border-slate-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* SUBTOTAL & REMOVE */}
                      <div className="w-20 text-right font-black text-blue-700 pl-2">
                        {formatRupiah(item.subtotal)}
                      </div>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="ml-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. DISCOUNT & SUMMARY */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              {/* Discount Input */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-medium">Diskon:</span>
                <div className="flex items-center gap-1.5">
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium rounded-lg px-2 py-1"
                  >
                    <option value="nominal">Rp</option>
                    <option value="percent">%</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={discountValue || ""}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-24 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-right text-xs text-slate-900 font-semibold"
                  />
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatRupiah(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Potongan Diskon:</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}

              {/* GRAND TOTAL */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  TOTAL BAYAR:
                </span>
                <span className="font-black text-xl text-blue-700">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>

            {/* 4. PAYMENT METHOD */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: "CASH", label: "💵 Cash" },
                  { id: "QRIS", label: "📱 QRIS" },
                  { id: "TRANSFER", label: "🏦 Transfer" },
                  { id: "DEBIT", label: "💳 Debit" },
                  { id: "KREDIT", label: "💳 Kredit" },
                  { id: "E_WALLET", label: "👛 E-Wallet" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 px-2 rounded-xl font-bold text-center transition cursor-pointer ${
                      paymentMethod === m.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* CASH INPUT & QUICK BUTTONS */}
              {paymentMethod === "CASH" && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-bold">Uang Diterima:</span>
                    <input
                      type="number"
                      value={amountPaid || ""}
                      onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                      className="w-32 px-2.5 py-1.5 rounded-xl bg-white border border-blue-400 text-right font-black text-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* QUICK CASH NOMINAL BUTTONS */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[grandTotal, 50000, 100000, 150000, 200000].map((nom, i) => (
                      <button
                        key={i}
                        onClick={() => setAmountPaid(nom)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-[10px] text-slate-700 font-bold border border-slate-200 cursor-pointer"
                      >
                        {nom === grandTotal ? "Uang Pas" : formatRupiah(nom)}
                      </button>
                    ))}
                  </div>

                  {/* CHANGE / KEMBALIAN */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-700 font-bold">KEMBALIAN:</span>
                    <span className="font-extrabold text-base text-emerald-600">
                      {formatRupiah(changeAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. PROCESS CHECKOUT BUTTON */}
            <button
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm tracking-wider uppercase transition shadow-lg shadow-blue-600/25 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Simpan & Cetak Struk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </Card>
        </div>
      </div>

      {/* MODAL SEARCH & TAMBAH CUSTOMER BARU */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Pilih atau Tambah Customer"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* SEARCH FIELD */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
              Cari Pelanggan Terdaftar
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan Nama, No. HP, atau Instagram..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            {/* RESULTS LIST */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {searchResults.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => handleSelectExistingCustomer(cust)}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {cust.phone || "No HP: -"} | {cust.instagram || "IG: -"}
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-700 font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                      Pilih
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">
              atau input customer baru
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* FORM CUSTOMER BARU */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Customer <span className="text-rose-500 font-bold">* WAJIB</span>
              </label>
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Contoh: Budi"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. HP (Opsional)
              </label>
              <input
                type="text"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Contoh: 081234567890 (boleh kosong)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Instagram (Opsional)
              </label>
              <input
                type="text"
                value={newCustomerInstagram}
                onChange={(e) => setNewCustomerInstagram(e.target.value)}
                placeholder="Contoh: @budi_pratama (boleh kosong)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <p className="text-[11px] text-slate-400 italic">
              &quot;No. HP dan Instagram boleh dikosongkan. Isi salah satu atau keduanya jika tersedia.&quot;
            </p>

            <Button
              onClick={handleSaveNewCustomer}
              variant="primary"
              className="w-full mt-2 font-bold shadow-md shadow-blue-500/25"
            >
              + Simpan Customer untuk Transaksi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
