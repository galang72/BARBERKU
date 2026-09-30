"use client";

import React from "react";
import Image from "next/image";
import { formatDateIndo, formatDateTimeIndo } from "@/lib/utils";

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  periodText: string;
}

export function ReportHeader({ title, subtitle, periodText }: ReportHeaderProps) {
  const printTime = formatDateTimeIndo(new Date());

  return (
    <div className="hidden print:block pb-4 mb-4 border-b-2 border-black">
      {/* KOP RESMI AD BARBERSHOP */}
      <div className="flex items-center justify-between gap-4 pb-3">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 relative flex-shrink-0">
            <Image
              src="/logo-ad-barbershop-light.png"
              alt="Logo Resmi AD Barbershop"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider text-black">
              AD BARBERSHOP
            </h1>
            <p className="text-xs text-gray-700 font-medium">
              Premium Men&apos;s Grooming & Classic Barbershop
            </p>
            <p className="text-[11px] text-gray-600">
              Jl. Telekomunikasi No.234, Lengkong, Kec. Bojongsoang, Kabupaten Bandung, Jawa Barat 40287 • WhatsApp / Telepon: 0895-3267-09996
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] text-gray-600 space-y-0.5">
          <div>Dicetak: {printTime}</div>
          <div>Otoritas: Admin AD Barbershop</div>
          <div className="font-semibold text-black">STATUS: DOKUMEN RESMI</div>
        </div>
      </div>

      {/* JUDUL DOKUMEN LAPORAN */}
      <div className="pt-2 text-center">
        <h2 className="text-base font-black uppercase tracking-wide text-black">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
        <div className="inline-block mt-1 px-3 py-0.5 rounded bg-gray-100 text-xs font-bold text-black border border-gray-300">
          Periode: {periodText}
        </div>
      </div>
    </div>
  );
}
