"use client";

import React from "react";
import { formatDateIndo } from "@/lib/utils";

interface ReportFooterProps {
  signerName?: string;
}

export function ReportFooter({ signerName = "Admin AD Barbershop" }: ReportFooterProps) {
  const today = formatDateIndo(new Date());

  return (
    <div className="hidden print:block pt-8 mt-6 border-t border-gray-400">
      <div className="flex justify-between items-end text-xs text-black">
        <div>
          <p className="text-[10px] text-gray-500 italic max-w-sm">
            Dokumen ini merupakan laporan pembukuan resmi operasional AD BARBERSHOP yang dihasilkan otomatis dari sistem.
          </p>
        </div>

        <div className="text-center space-y-1">
          <p>Jakarta, {today}</p>
          <p className="font-semibold">Penanggung Jawab,</p>
          <div className="h-14"></div>
          <p className="font-bold underline uppercase">{signerName}</p>
          <p className="text-[10px] text-gray-600">Sistem Manajemen Barbershop</p>
        </div>
      </div>
    </div>
  );
}
