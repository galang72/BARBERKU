"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Username atau password salah");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/40 relative overflow-hidden">
      {/* Decorative Blue Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* CARD CONTAINER */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
          {/* BRAND HEADER */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative w-20 h-20 mb-4 p-2.5 rounded-2xl bg-white border-2 border-blue-600/30 shadow-lg shadow-blue-500/10 flex items-center justify-center">
              <Image
                src="/logo-ad-barbershop.png"
                alt="AD Barbershop Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-black tracking-wider text-slate-900">
              AD BARBERSHOP
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Sistem Operasional & Manajemen Kasir Multi-Cabang
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* FORM LOGIN */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide transition shadow-lg shadow-blue-600/25 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* FOOTER BADGE */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Login Terproteksi JWT</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Cabang Telkom & Suta</span>
          </div>
        </div>
      </div>
    </div>
  );
}
