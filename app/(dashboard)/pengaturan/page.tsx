"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  Lock,
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Trash2,
  Database,
  AlertTriangle,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PengaturanPage() {
  const [shopName, setShopName] = useState("AD BARBERSHOP");
  const [address, setAddress] = useState("Jl. Telekomunikasi No.234, Lengkong, Kec. Bojongsoang, Kabupaten Bandung, Jawa Barat 40287");
  const [phone, setPhone] = useState("0895-3267-09996");
  const [receiptHeader, setReceiptHeader] = useState("Grooming & Classic Haircut");
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih Atas Kunjungan Anda! Tampil Lebih Percaya Diri Bersama AD Barbershop.");
  const [initialCashFloat, setInitialCashFloat] = useState(100000);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reset Demo Data
  const [resetting, setResetting] = useState(false);

  // Database Connection Diagnostics
  const [dbDiag, setDbDiag] = useState<any>(null);
  const [checkingDb, setCheckingDb] = useState(false);

  const checkDatabase = () => {
    setCheckingDb(true);
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setDbDiag(data))
      .catch((e) => console.error(e))
      .finally(() => setCheckingDb(false));
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setShopName(data.shopName || "AD BARBERSHOP");
          setAddress(data.address || "");
          setPhone(data.phone || "");
          setReceiptHeader(data.receiptHeader || "");
          setReceiptFooter(data.receiptFooter || "");
          setInitialCashFloat(data.initialCashFloat || 100000);
        }
      })
      .catch((e) => console.error(e));

    checkDatabase();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          address,
          phone,
          receiptHeader,
          receiptFooter,
          initialCashFloat,
        }),
      });
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (e) {
      alert("Gagal menyimpan pengaturan");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password baru minimal 6 karakter!" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Konfirmasi password baru tidak cocok!" });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengubah password");

      setPasswordMsg({ type: "success", text: "Password Admin berhasil diperbarui!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetDemoData = async (mode: "demo" | "clean" = "demo") => {
    const confirmMessage =
      mode === "clean"
        ? "PERINGATAN: Kosongkan semua riwayat transaksi, booking, dan pembayaran kasir?\n\nData Master (Barberman, Layanan, Produk, Akun Admin) tetap disimpan agar Anda bisa langsung mulai jualan riil!"
        : "Reset data ke sampel demo default (3 Barberman Arie/Azis/Dani, produk, dan sampel transaksi demo)?";

    if (confirm(confirmMessage)) {
      setResetting(true);
      try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });
        const data = await res.json();
        alert(data.message || "Data berhasil di-reset!");
        window.location.reload();
      } catch (e) {
        alert("Gagal reset data");
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>PENGATURAN SISTEM & TOKO</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi profil barbershop, teks struk transaksi, akun admin, dan database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SHOP SETTINGS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200/80 shadow-sm bg-white p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Profil & Struk Barbershop</CardTitle>
                <p className="text-xs text-slate-500">Data ini akan dicetak pada struk thermal dan invoice transaksi.</p>
              </div>
            </div>

            {settingsSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Pengaturan barbershop berhasil disimpan!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barbershop
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modal Kas Awal Laci (Float)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={initialCashFloat}
                    onChange={(e) => setInitialCashFloat(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-blue-700 font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Barbershop
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Header Struk
                </label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pesan Footer Struk Pembayaran
                </label>
                <textarea
                  rows={2}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <Button
                type="submit"
                disabled={savingSettings}
                variant="primary"
                className="w-full font-bold shadow-md shadow-blue-500/20"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingSettings ? "Menyimpan..." : "Simpan Profil Barbershop"}
              </Button>
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: ADMIN SECURITY & DEMO DATA (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* GANTI PASSWORD ADMIN */}
          <Card className="border-slate-200/80 shadow-sm bg-white p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Keamanan Akun Admin</CardTitle>
                <p className="text-xs text-slate-500">Ubah kata sandi akun Admin AD Barbershop.</p>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {passwordMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Lama
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Password saat ini"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Baru (Min. 6 Karakter)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password baru"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <Button
                type="submit"
                disabled={savingPassword}
                variant="outline"
                className="w-full font-bold text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                {savingPassword ? "Memperbarui..." : "Perbarui Password"}
              </Button>
            </form>
          </Card>

          {/* STATUS DATABASE & CLOUD SYNC */}
          <Card className={`border shadow-sm p-6 ${dbDiag?.connected ? "border-emerald-200 bg-white" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${dbDiag?.connected ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-blue-50 text-blue-600 border border-blue-200"}`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Status Database Cloud</CardTitle>
                  <p className="text-xs text-slate-500">Penyimpanan data riil transaksi kasir & laporan.</p>
                </div>
              </div>
              <Button
                onClick={checkDatabase}
                disabled={checkingDb}
                variant="outline"
                size="sm"
                className="text-[11px] h-8 px-2.5 border-slate-200 text-slate-700"
              >
                <RefreshCw className={`w-3 h-3 mr-1.5 ${checkingDb ? "animate-spin" : ""}`} />
                {checkingDb ? "Memeriksa..." : "Tes Koneksi"}
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${dbDiag?.connected ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`} />
                <span className={`text-xs font-bold ${dbDiag?.connected ? "text-emerald-700" : "text-blue-700"}`}>
                  {dbDiag?.connected ? "Terhubung ke Supabase Cloud (Data Permanen)" : "Mode Database Lokal / File (Aktif & Terjaga)"}
                </span>
              </div>

              {dbDiag?.connected ? (
                <div className="text-[11px] text-slate-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1">
                  <div className="text-emerald-800 font-semibold">Semua data kasir & transaksi tersimpan aman di Supabase.</div>
                  <div className="text-slate-500 text-[10px]">
                    Koneksi: {dbDiag?.connectionType}
                    {dbDiag?.tableCounts && ` • Transaksi: ${dbDiag.tableCounts.transactions} • Layanan: ${dbDiag.tableCounts.services} • Produk: ${dbDiag.tableCounts.products}`}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl leading-relaxed">
                    <div className="font-bold flex items-center gap-1 text-slate-800 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                      Status Penyimpanan Data:
                    </div>
                    {dbDiag?.warning || "Sistem saat ini aktif menggunakan database lokal terintegrasi. Semua produk, layanan, transfer, dan transaksi tersimpan aman."}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* SINKRONISASI & RESET DATA */}
          <Card className="border-slate-200/80 shadow-sm bg-white p-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Reset & Manajemen Data</CardTitle>
                <p className="text-xs text-slate-500">Pilih reset sampel demo atau bersihkan transaksi untuk jualan nyata.</p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              {/* OPSI 1: RESET DATA DEMO */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Opsi 1: Reset ke Data Sampel Demo</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mengembalikan 3 barberman, produk lengkap, stok penuh, dan sampel transaksi demo untuk uji coba kasir & laporan.
                </p>
                <Button
                  onClick={() => handleResetDemoData("demo")}
                  disabled={resetting}
                  variant="outline"
                  className="w-full mt-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${resetting ? "animate-spin" : ""}`} />
                  {resetting ? "Memproses..." : "Reset ke Data Sampel Default"}
                </Button>
              </div>

              {/* OPSI 2: BERSIHKAN TRANSAKSI */}
              <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Opsi 2: Kosongkan Transaksi (Siap Jualan Riil)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Menghapus riwayat transaksi kasir dan booking lama, namun mempertahankan data Barberman, Layanan, dan Produk.
                </p>
                <Button
                  onClick={() => handleResetDemoData("clean")}
                  disabled={resetting}
                  variant="outline"
                  className="w-full mt-2 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  {resetting ? "Memproses..." : "Kosongkan Riwayat Transaksi"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
