"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Instagram,
  Receipt,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/export";

export default function CustomerPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Customer Detail Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Customer Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  const fetchCustomers = async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/customers?q=${encodeURIComponent(q)}` : "/api/customers";
      const res = await fetch(url);
      const json = await res.json();
      setCustomers(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  const openDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      const json = await res.json();
      setCustomerDetail(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Nama Customer wajib diisi!");
      return;
    }

    setSavingCustomer(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim() || null,
          instagram: formInstagram.trim() || null,
          address: formAddress.trim() || null,
          notes: formNotes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan customer");

      setAddModalOpen(false);
      setFormName("");
      setFormPhone("");
      setFormInstagram("");
      setFormAddress("");
      setFormNotes("");
      fetchCustomers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleExport = (type: "excel" | "csv") => {
    const formatted = customers.map((c) => ({
      "Nama Pelanggan": c.name,
      "No. Telepon": c.phone || "-",
      "Instagram": c.instagram || "-",
      "Total Kunjungan": c.totalVisits,
      "Total Pengeluaran": c.totalSpend,
      "Kunjungan Terakhir": formatDateIndo(c.lastVisitAt),
      "Barberman Favorit": c.favoriteBarberman?.name || "-",
    }));

    if (type === "excel") exportToExcel(formatted, "Data_Customer_AD_Barbershop");
    else exportToCSV(formatted, "Data_Customer_AD_Barbershop");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>DATABASE CUSTOMER</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data pelanggan, riwayat kunjungan, barberman favorit, dan total belanja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleExport("excel")} variant="outline" size="sm" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Excel
          </Button>
          <Button onClick={() => setAddModalOpen(true)} variant="primary" size="sm" className="shadow-md shadow-blue-500/20">
            <UserPlus className="w-4 h-4 mr-1.5" />
            + Tambah Customer
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
            placeholder="Cari berdasarkan nama customer, nomor HP, atau username Instagram..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>
      </Card>

      {/* CUSTOMER TABLE */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Kontak / Media</th>
                <th className="py-3.5 px-4 text-center">Kunjungan</th>
                <th className="py-3.5 px-4 text-right">Total Belanja</th>
                <th className="py-3.5 px-4">Barberman Favorit</th>
                <th className="py-3.5 px-4 text-center">Kunjungan Terakhir</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs">Memuat data customer...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada customer yang sesuai pencarian</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba gunakan kata kunci pencarian lainnya.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-xs shadow-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ID: {c.id.substring(0, 10)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs space-y-1">
                      {c.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">No HP: -</div>
                      )}
                      {c.instagram && (
                        <div className="flex items-center gap-1.5 text-pink-600 font-medium">
                          <Instagram className="w-3 h-3 text-pink-500" />
                          <span>{c.instagram}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                        {c.totalVisits}x
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-700">
                      {formatRupiah(c.totalSpend)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      {c.favoriteBarberman ? (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium inline-flex items-center gap-1">
                          💈 {c.favoriteBarberman.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                      {formatDateIndo(c.lastVisitAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        onClick={() => openDetail(c.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Riwayat
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL DETAIL CUSTOMER WITH FULL TRANSACTION HISTORY */}
      <Modal
        isOpen={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        title="Detail Customer & Riwayat Transaksi"
        maxWidth="max-w-2xl"
      >
        {loadingDetail || !customerDetail ? (
          <div className="py-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs">Memuat profil pelanggan...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Profil */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>{customerDetail.name}</span>
                  {customerDetail.members?.length > 0 && (
                    <Badge variant="blue">Member VIP</Badge>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-4">
                  {customerDetail.phone && <span>📞 {customerDetail.phone}</span>}
                  {customerDetail.instagram && <span className="text-pink-600">📷 {customerDetail.instagram}</span>}
                  {customerDetail.address && <span>📍 {customerDetail.address}</span>}
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                <div className="text-xs text-slate-500">Total Pengeluaran</div>
                <div className="text-xl font-black text-blue-700">
                  {formatRupiah(customerDetail.totalSpend)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {customerDetail.totalVisits} kali kunjungan
                </div>
              </div>
            </div>

            {/* Riwayat Transaksi */}
            <div>
              <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-4 h-4" />
                <span>Riwayat Transaksi & Layanan</span>
              </h4>

              {customerDetail.transactions?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
                  Belum ada catatan transaksi untuk customer ini.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {customerDetail.transactions?.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 font-mono">{tx.invoiceNumber}</span>
                        <span className="text-slate-500 text-[11px]">{formatDateTimeIndo(tx.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Barberman: <strong className="text-blue-700">{tx.barberman?.name || "-"}</strong></span>
                        <span>Metode: <strong className="text-slate-800">{tx.paymentMethod}</strong></span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        {tx.items?.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-[11px] text-slate-600">
                            <span>{it.name} x{it.quantity}</span>
                            <span className="text-slate-900 font-semibold">{formatRupiah(it.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                        <span>Total Transaksi</span>
                        <span className="text-blue-700 font-black">{formatRupiah(tx.grandTotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL TAMBAH CUSTOMER BARU */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Pendaftaran Customer Baru"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Customer <span className="text-rose-500 font-bold">* Wajib</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Budi Pratama"
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
              placeholder="Contoh: 081234567890 (boleh kosong)"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Akun Instagram (Opsional)
            </label>
            <input
              type="text"
              value={formInstagram}
              onChange={(e) => setFormInstagram(e.target.value)}
              placeholder="Contoh: @budi_pratama (boleh kosong)"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Domisili (Opsional)
            </label>
            <textarea
              rows={2}
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Contoh: Tebet, Jakarta Selatan"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <p className="text-[11px] text-slate-400 italic">
            &quot;No. HP dan Instagram boleh dikosongkan. Customer dapat disimpan hanya dengan nama.&quot;
          </p>

          <Button
            type="submit"
            disabled={savingCustomer}
            variant="primary"
            className="w-full font-bold shadow-md shadow-blue-500/20"
          >
            {savingCustomer ? "Menyimpan..." : "Simpan Customer"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
