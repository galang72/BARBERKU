import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AD BARBERSHOP - Sistem Kasir & Administrasi",
  description: "Sistem Manajemen Kasir, Booking, Inventaris & Administrasi AD Barbershop",
  icons: {
    icon: "/logo-ad-barbershop.png",
    shortcut: "/logo-ad-barbershop.png",
    apple: "/logo-ad-barbershop.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#090a0f] text-gray-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
