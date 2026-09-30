"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  Users,
  CreditCard,
  Scissors,
  Package,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  ArrowLeftRight,
  Crown,
  Building2,
  Shield,
  Send,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isReportsOpen, setIsReportsOpen] = useState(pathname.startsWith("/laporan"));
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

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Kasir", href: "/kasir", icon: ShoppingCart, badge: "POS" },
    { label: "Booking", href: "/booking", icon: Calendar },
    { label: "Customer", href: "/customer", icon: Users },
    { label: "Member", href: "/member", icon: CreditCard },
    { label: "Barberman", href: "/barberman", icon: Users },
    { label: "Layanan", href: "/layanan", icon: Scissors },
    { label: "Produk & Stok", href: "/produk", icon: Package },
    { label: "Transfer Produk", href: "/transfer", icon: ArrowLeftRight, badge: "Cabang" },
    { label: "Penjualan Produk", href: "/penjualan", icon: ShoppingBag },
    { label: "Cash Management", href: "/cash", icon: DollarSign },
  ];

  const isOwner = user?.role === "OWNER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN_TELKOM" || user?.role === "ADMIN_SUTA";

  const reportItems = [
    { label: "Laporan Harian", href: "/laporan/harian" },
    { label: "Laporan Bulanan", href: "/laporan/bulanan" },
    { label: "Laporan Tahunan", href: "/laporan/tahunan" },
    { label: "Laporan Barberman", href: "/laporan/barberman" },
    { label: "Laporan Pomade", href: "/laporan/pomade" },
    { label: "Laporan Tonic & Powder", href: "/laporan/tonic-powder" },
    // Owner: pantau laporan dari semua cabang
    ...(isOwner ? [{ label: "📊 Laporan Cabang", href: "/laporan/cabang", badge: "Owner" }] : []),
    // Admin: kirim laporan ke owner
    ...(isAdmin ? [{ label: "📤 Kirim Laporan ke Owner", href: "/laporan/kirim", badge: "Baru" }] : []),
  ];

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin logout dari sistem?")) {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    }
  };

  const getRoleBadge = () => {
    if (!user) {
      return {
        label: "Admin",
        sub: "AD Barbershop",
        icon: Shield,
        color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
      };
    }
    if (user.role === "OWNER") {
      return {
        label: "Owner",
        sub: "Semua Cabang",
        icon: Crown,
        color: "bg-amber-500/20 text-amber-300 border-amber-400/30",
      };
    }
    if (user.role === "ADMIN_TELKOM") {
      return {
        label: "Admin Telkom",
        sub: "Cabang Telkom",
        icon: Building2,
        color: "bg-sky-500/20 text-sky-300 border-sky-400/30",
      };
    }
    if (user.role === "ADMIN_SUTA") {
      return {
        label: "Admin Suta",
        sub: "Cabang Suta",
        icon: Building2,
        color: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
      };
    }
    return {
      label: "Admin",
      sub: "Operasional",
      icon: Shield,
      color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    };
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  const content = (
    <div className="flex flex-col h-full bg-[#0c1633] border-r border-[#1a2b56] text-slate-200">
      {/* BRANDING HEADER WITH OFFICIAL LOGO */}
      <div className="p-4 border-b border-[#1a2b56] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-2xl bg-white border-2 border-blue-500/30 p-1 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
            <Image
              src="/logo-ad-barbershop.png"
              alt="AD Barbershop Logo"
              width={38}
              height={38}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="font-extrabold text-white tracking-wider text-sm flex items-center gap-1.5">
              AD BARBERSHOP
            </div>
            <div className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Management System
            </div>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ACTIVE ROLE BANNER */}
      <div className="px-3 pt-3">
        <div className={cn("p-2.5 rounded-2xl border flex items-center gap-2.5", roleInfo.color)}>
          <div className="p-1.5 rounded-xl bg-black/20">
            <RoleIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold truncate leading-tight text-white">{roleInfo.label}</div>
            <div className="text-[10px] text-slate-300 truncate">{roleInfo.sub}</div>
          </div>
        </div>
      </div>

      {/* NAVIGATION ITEMS */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group",
                isActive
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                  : "text-slate-300 hover:bg-[#132247] hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-blue-400"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md",
                    isActive ? "bg-white/20 text-white" : "bg-blue-500/20 text-blue-300"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* LAPORAN ACCORDION */}
        <div className="pt-2">
          <button
            onClick={() => setIsReportsOpen(!isReportsOpen)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150",
              pathname.startsWith("/laporan")
                ? "bg-[#132247] text-blue-400 border border-blue-500/30 font-semibold"
                : "text-slate-300 hover:bg-[#132247] hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Laporan</span>
            </div>
            {isReportsOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isReportsOpen && (
            <div className="pl-6 pr-1 pt-1.5 space-y-1">
              {reportItems.map((rep) => {
                const isRepActive = pathname === rep.href;
                return (
                  <Link
                    key={rep.href}
                    href={rep.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition",
                      isRepActive
                        ? "bg-blue-600/20 text-blue-300 border-l-2 border-blue-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#132247]"
                    )}
                  >
                    <span>{rep.label}</span>
                    {(rep as any).badge && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300">
                        {(rep as any).badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* PENGATURAN */}
        <div className="pt-2">
          <Link
            href="/pengaturan"
            onClick={onCloseMobile}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150",
              pathname === "/pengaturan"
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                : "text-slate-300 hover:bg-[#132247] hover:text-white"
            )}
          >
            <Settings
              className={cn(
                "w-4 h-4",
                pathname === "/pengaturan" ? "text-white" : "text-blue-400"
              )}
            />
            <span>Pengaturan</span>
          </Link>
        </div>
      </div>

      {/* FOOTER USER ADMIN & LOGOUT */}
      <div className="p-3 border-t border-[#1a2b56] bg-[#091126]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#101c3d] border border-[#1a2b56]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="min-w-0 truncate">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || "Admin AD"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email || "admin@adbarbershop.com"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0 ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed left-0 top-0 z-30">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85%] h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
