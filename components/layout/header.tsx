"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingCart, Clock, ArrowLeftRight, Building2, Crown, Shield } from "lucide-react";
import { formatDateIndo } from "@/lib/utils";

interface HeaderProps {
  onToggleMobile: () => void;
}

export function Header({ onToggleMobile }: HeaderProps) {
  const todayStr = formatDateIndo(new Date());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const getRoleBranchBadge = () => {
    if (!user) {
      return {
        label: "Cabang Telkom & Suta",
        icon: Building2,
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
    }
    if (user.role === "OWNER") {
      return {
        label: "👑 Owner - Semua Cabang (Telkom & Suta)",
        icon: Crown,
        color: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
      };
    }
    if (user.role === "ADMIN_TELKOM") {
      return {
        label: "🏢 Operasional Cabang Telkom",
        icon: Building2,
        color: "bg-sky-50 text-sky-800 border-sky-200 font-bold",
      };
    }
    if (user.role === "ADMIN_SUTA") {
      return {
        label: "🏢 Operasional Cabang Suta",
        icon: Building2,
        color: "bg-indigo-50 text-indigo-800 border-indigo-200 font-bold",
      };
    }
    return {
      label: "🏢 Multi-Cabang",
      icon: Shield,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    };
  };

  const badge = getRoleBranchBadge();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 md:px-8 flex items-center justify-between shadow-sm">
      {/* LEFT: Mobile Menu Button & Mobile Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
          aria-label="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white border border-blue-300 p-0.5 flex items-center justify-center">
            <Image
              src="/logo-ad-barbershop.png"
              alt="AD Barbershop"
              width={26}
              height={26}
              className="object-contain"
            />
          </div>
          <span className="font-extrabold text-sm text-slate-900 tracking-wider">
            AD BARBERSHOP
          </span>
        </div>

        {/* Desktop Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Hari ini: <strong className="text-slate-800">{todayStr}</strong></span>
        </div>

        {/* Branch / Role Indicator */}
        <div className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs ${badge.color}`}>
          <span>{badge.label}</span>
        </div>
      </div>

      {/* RIGHT: Quick Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Status Operasional */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sistem Aktif</span>
        </div>

        {/* Quick Transfer Produk Button */}
        <Link
          href="/transfer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition border border-slate-200 active:scale-95"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
          <span>Transfer Produk</span>
        </Link>

        {/* Quick Kasir Button */}
        <Link
          href="/kasir"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20 active:scale-95"
        >
          <ShoppingCart className="w-4 h-4 text-white" />
          <span>Buka Kasir</span>
        </Link>
      </div>
    </header>
  );
}
