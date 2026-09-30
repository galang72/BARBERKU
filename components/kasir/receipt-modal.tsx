"use client";

import React from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Printer, Share2, CheckCircle2 } from "lucide-react";
import { formatRupiah, formatDateTimeIndo } from "@/lib/utils";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  settings?: any;
}

export function ReceiptModal({
  isOpen,
  onClose,
  transaction,
  settings,
}: ReceiptModalProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!transaction.customerPhone) {
      alert("Nomor HP customer tidak tersedia untuk dikirimkan struk WhatsApp.");
      return;
    }
    const cleanPhone = transaction.customerPhone.replace(/[^0-9]/g, "");
    const phone = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone;
    
    const text = encodeURIComponent(
      `*STRUK PEMBAYARAN AD BARBERSHOP*\n` +
      `No. Invoice: ${transaction.invoiceNumber}\n` +
      `Tanggal: ${formatDateTimeIndo(transaction.createdAt)}\n` +
      `Customer: ${transaction.customerName}\n` +
      `Barberman: ${transaction.barberman?.name || "-"}\n` +
      `--------------------------------\n` +
      transaction.items
        ?.map((it: any) => `${it.name} x${it.quantity} = ${formatRupiah(it.subtotal)}`)
        .join("\n") +
      `\n--------------------------------\n` +
      `Total: ${formatRupiah(transaction.grandTotal)}\n` +
      `Metode: ${transaction.paymentMethod}\n` +
      `\nTerima kasih telah mempercayakan penampilan Anda di AD BARBERSHOP! ✂️💈`
    );

    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const shopName = settings?.shopName || "AD BARBERSHOP";
  const shopAddress = settings?.address || "Jl. Telekomunikasi No.234, Lengkong, Kec. Bojongsoang, Kabupaten Bandung, Jawa Barat 40287";
  const shopPhone = settings?.phone || "0895-3267-09996";
  const receiptFooter = settings?.receiptFooter || "Terima Kasih Atas Kunjungan Anda! Tampil Lebih Percaya Diri Bersama AD Barbershop.";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Pembayaran Transaksi" maxWidth="max-w-md">
      <div className="flex flex-col items-center">
        {/* SUCCESS ICON */}
        <div className="flex items-center gap-2 text-emerald-400 mb-3 no-print">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">Transaksi Berhasil Disimpan</span>
        </div>

        {/* THERMAL RECEIPT CONTAINER */}
        <div className="printable-thermal printable-area w-full bg-white text-black p-5 rounded-xl font-mono text-xs shadow-inner border border-gray-300">
          {/* LOGO RESMI AD BARBERSHOP PADA STRUK */}
          <div className="flex flex-col items-center text-center pb-3 border-b border-dashed border-gray-400">
            <div className="w-20 h-20 relative mb-1">
              <Image
                src="/logo-ad-barbershop-light.png"
                alt="AD Barbershop Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="font-extrabold text-base tracking-wider">{shopName}</div>
            <div className="text-[11px] text-gray-700">{shopAddress}</div>
            <div className="text-[11px] text-gray-700">Telp/WA: {shopPhone}</div>
          </div>

          {/* INVOICE META */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>No. Invoice:</span>
              <span className="font-bold">{transaction.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{formatDateTimeIndo(transaction.createdAt || new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold">
                {transaction.customerName}
                {transaction.customerInstagram ? ` (${transaction.customerInstagram})` : ""}
              </span>
            </div>
            {transaction.customerPhone && (
              <div className="flex justify-between">
                <span>No. HP:</span>
                <span>{transaction.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Barberman:</span>
              <span className="font-bold text-black">{transaction.barberman?.name || "Barberman AD"}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>Admin AD</span>
            </div>
          </div>

          {/* ITEMS LIST */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-2">
            {transaction.items?.map((item: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-semibold text-black">{item.name}</div>
                <div className="flex justify-between text-[11px] text-gray-700">
                  <span>
                    {item.quantity} x {formatRupiah(item.price)}
                  </span>
                  <span className="font-bold text-black">{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* TOTALS & PAYMENT */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatRupiah(transaction.subtotal)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon:</span>
                <span>-{formatRupiah(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-black pt-1 border-t border-gray-300">
              <span>TOTAL BAYAR:</span>
              <span>{formatRupiah(transaction.grandTotal)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Metode Bayar:</span>
              <span className="font-bold">{transaction.paymentMethod}</span>
            </div>
            {transaction.payments?.[0] && (
              <>
                <div className="flex justify-between">
                  <span>Diterima:</span>
                  <span>{formatRupiah(transaction.payments[0].amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(transaction.payments[0].changeAmount)}</span>
                </div>
              </>
            )}
          </div>

          {/* FOOTER MESSAGE */}
          <div className="pt-3 text-center space-y-1 text-[10px] text-gray-600">
            <p className="italic">{receiptFooter}</p>
            <p className="font-semibold text-[9px] text-gray-500">
              *** SIMPAN STRUK INI SEBAGAI BUKTI PEMBAYARAN ***
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS (NO-PRINT) */}
        <div className="flex items-center gap-3 w-full mt-5 no-print">
          <Button
            onClick={handlePrint}
            variant="primary"
            className="flex-1 py-2.5 font-bold"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak Struk
          </Button>

          {transaction.customerPhone && (
            <Button
              onClick={handleWhatsAppShare}
              variant="outline"
              className="py-2.5 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              title="Kirim ke WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}

          <Button onClick={onClose} variant="secondary" className="py-2.5">
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
