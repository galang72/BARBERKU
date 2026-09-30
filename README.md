# AD BARBERSHOP - Sistem Manajemen Kasir & Administrasi Barbershop

Sistem web modern, premium, responsive (mobile-friendly), dan production-ready untuk operasional barbershop profesional bernama **AD BARBERSHOP**.

Didesain dengan tema visual **Hitam / Dark + Aksen Emas / Kuning**, kompatibel penuh dengan **Vercel Serverless**, dan menggunakan database cloud **Supabase PostgreSQL**.

---

## 💈 Fitur Utama Sistem

1. **Role Tunggal (Admin)**: Manajemen operasional berpusat pada akun Admin. Barberman (**Arie, Azis, Dani**) adalah entitas data yang dipilih saat transaksi & booking.
2. **Dashboard Realtime**:
   - Customer hari ini, Transaksi hari ini, Omzet hari ini & bulan ini, Booking hari ini, Total member, Total produk, Produk hampir habis, Penjualan produk, Cash di tangan.
   - **Tabel Performa Barberman** (Arie, Azis, Dani) dengan filter: *Hari ini, Kemarin, Minggu ini, Bulan ini, Tahun ini, Custom*.
3. **Kasir (POS) Cepat**:
   - Fleksibilitas data customer:
     - Kasus 1: Nama saja (Budi, HP: NULL, IG: NULL)
     - Kasus 2: Nama + No HP (Budi, HP: 081234567890, IG: NULL)
     - Kasus 3: Nama + Instagram (Budi, HP: NULL, IG: @budi_pratama)
     - Kasus 4: Nama + No HP + Instagram (Budi, HP: 081234567890, IG: @budi_pratama)
   - Diskon, kalkulasi otomatis, multi pembayaran (Cash, QRIS, Transfer, Debit, Kredit, E-Wallet).
   - Cetak Struk Thermal (58mm/80mm) dengan Logo Resmi AD Barbershop & Share WhatsApp.
   - **Otomatisasi**: Stok produk otomatis berkurang, customer visit bertambah, performa barberman bertambah, kas laci bertambah jika tunai.
4. **Customer & Member Management**:
   - Pencarian nama, nomor HP, instagram.
   - Detail riwayat transaksi & kunjungan lengkap.
   - Registrasi paket member, perpanjangan, dan status keaktifan.
5. **Booking & Antrean**:
   - Kalender dan tabel reservasi (Pending, Confirmed, Arrived, In Progress, Completed, Cancelled).
   - 1-Klik shortcut "Ke Kasir" untuk tamu yang sudah tiba.
6. **Inventaris Produk & Mutasi Stok**:
   - Kategori khusus: Pomade, Tonic, Powder, Shampoo, Hair Wax, Hair Clay, Hair Spray, Lainnya.
   - Modal input Stock In (Restock), Stock Out (Rusak), dan Stock Opname (Audit).
7. **Laporan Khusus & Keuangan**:
   - Laporan Khusus Pomade (terjual, omzet, modal, laba bersih, sisa stok).
   - Laporan Khusus Tonic & Powder.
   - Laporan Harian, Bulanan, dan Tahunan (Grafik 12 bulan).
   - Laporan Kinerja per Barberman.
   - Cash Management: `Cash Awal + Cash Masuk - Cash Keluar = Cash Saat Ini` & Rekonsiliasi Kas Fisik.
8. **Export Fleksibel**:
   - Seluruh tabel & laporan dapat diekspor ke **Excel (.xlsx)**, **CSV**, dan **Print/PDF**.

---

## 🛠️ Persyaratan Lingkungan (Prerequisites)

- Node.js versi 18+ atau 20+
- Akun [Supabase](https://supabase.com/) (Gratis untuk database cloud PostgreSQL)
- Akun [Vercel](https://vercel.com/) (Gratis untuk deployment serverless)
- Git & Akun GitHub

---

## 🚀 Panduan Setup & Deployment Step-by-Step

### STEP 1: Install Dependensi

Buka terminal pada direktori proyek, lalu jalankan:
```bash
npm install
```

### STEP 2: Buat Database di Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru (misal: `ad-barbershop-db`).
2. Masuk ke menu **Project Settings -> Database**:
   - Ambil **Connection String** mode *Transaction Pooler* (Port 6543) untuk `DATABASE_URL`.
   - Ambil **Connection String** mode *Session* (Port 5432) untuk `DIRECT_URL`.
3. Masuk ke menu **Project Settings -> API**:
   - Ambil `Project URL` untuk `NEXT_PUBLIC_SUPABASE_URL`.
   - Ambil `anon public key` untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### STEP 3: Isi Environment Variables

Buat file `.env.local` pada root project (gunakan `.env.example` sebagai referensi):

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

JWT_SECRET="kunci-rahasia-ad-barbershop-super-aman-minimal-32-karakter"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### STEP 4: Jalankan Migrasi Database

Anda memiliki 2 opsi mudah untuk membuat tabel database:

#### Opsi A: Lewat Supabase SQL Editor (Paling Cepat & Direkomendasikan)
1. Buka menu **SQL Editor** di Supabase Dashboard Anda.
2. Salin isi file `supabase/schema.sql` lalu klik **Run**.
   *(Semua tabel, enum, foreign key, dan indeks otomatis dibuat).*

#### Opsi B: Menggunakan Prisma CLI
```bash
npx prisma db push
```

### STEP 5: Jalankan Seed (Data Demo & Barberman)

#### Opsi A: Lewat Supabase SQL Editor
Buka **SQL Editor** di Supabase, salin seluruh isi file `supabase/seed.sql` lalu klik **Run**.

#### Opsi B: Lewat Script Terminal
```bash
npm run db:seed
```

Data awal yang otomatis masuk:
- **Barberman**: Arie, Azis, Dani
- **Layanan**: Classic Haircut, Premium Wash & Massage, Beard Trim, Hair Spa, dll.
- **Produk**: Pomade Suavecito, Chief, Murray's, Tonic Ginseng/Menthol, Styling Powder, dll.
- **Customer**: Mendukung seluruh 4 skenario data pelanggan.

### STEP 6: Membuat / Memverifikasi Akun Admin

Jalankan perintah berikut:
```bash
npm run make-admin
```
Default login awal:
- **Username / Email**: `admin` atau `admin@adbarbershop.com`
- **Password**: `admin123`

*(Password dapat diganti kapan saja melalui menu **Pengaturan** di dalam aplikasi).*

### STEP 7: Menjalankan Aplikasi di Komputer Lokal

```bash
npm run dev
```
Buka browser di `http://localhost:3000/login`.

### STEP 8: Verifikasi Build Production

Pastikan build Next.js lulus tanpa error:
```bash
npm run build
```

---

## 🌐 STEP 9 & 10: Deploy ke Vercel (Production)

1. **Push Proyek ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi sistem AD Barbershop"
   git branch -M main
   git remote add origin https://github.com/[USERNAME-ANDA]/ad-barbershop.git
   git push -u origin main
   ```

2. **Import Repository ke Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com/) -> **Add New...** -> **Project**.
   - Pilih repository GitHub `ad-barbershop`.

3. **Masukkan Environment Variables di Vercel**:
   Pada menu **Environment Variables**, tambahkan:
   - `DATABASE_URL` = Connection string Supabase (Transaction Pooler)
   - `DIRECT_URL` = Connection string Supabase (Session 5432)
   - `NEXT_PUBLIC_SUPABASE_URL` = URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon Key Supabase
   - `JWT_SECRET` = String rahasia JWT Anda
   - `NEXT_PUBLIC_APP_URL` = URL domain Vercel Anda

4. **Klik Deploy**:
   Vercel akan secara otomatis melakukan build dan aplikasi **AD BARBERSHOP** langsung online dan dapat diakses dari smartphone maupun komputer manapun tanpa ketergantungan pada server lokal!

---

## 📁 Struktur Proyek

```text
AD-BARBERSHOP/
├── app/
│   ├── (auth)/login/page.tsx      # Halaman Login Admin Premium
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Responsive Sidebar & Topbar
│   │   ├── page.tsx               # Dashboard Metrik & Performa Barberman
│   │   ├── kasir/page.tsx         # POS Kasir Cepat (Customer fleksibel & Struk)
│   │   ├── booking/page.tsx       # Kalender Reservasi & Antrean
│   │   ├── customer/page.tsx      # Database Pelanggan & Riwayat
│   │   ├── member/page.tsx        # Membership Loyalty
│   │   ├── barberman/page.tsx     # Manajemen Barberman (Arie, Azis, Dani)
│   │   ├── layanan/page.tsx       # Menu Potong & Perawatan
│   │   ├── produk/page.tsx        # Inventaris & Mutasi Stok
│   │   ├── penjualan/page.tsx     # Penjualan Produk Retail
│   │   ├── cash/page.tsx          # Cash Management & Rekonsiliasi
│   │   ├── laporan/               # Laporan Lengkap
│   │   │   ├── harian/page.tsx
│   │   │   ├── bulanan/page.tsx
│   │   │   ├── tahunan/page.tsx
│   │   │   ├── barberman/page.tsx
│   │   │   ├── pomade/page.tsx
│   │   │   └── tonic-powder/page.tsx
│   │   └── pengaturan/page.tsx    # Profil Barbershop & Ganti Password
│   ├── api/                       # Vercel Serverless Route Handlers
│   ├── globals.css                # Tema Dark & Print Stylesheet Struk
│   └── layout.tsx
├── components/
│   ├── layout/                    # Sidebar & Header
│   ├── kasir/receipt-modal.tsx    # Thermal Receipt 58mm/80mm
│   └── ui/                        # Button, Card, Badge, Modal
├── lib/
│   ├── db.ts                      # Business Service Layer & Resilient Fallback
│   ├── prisma.ts                  # PostgreSQL Prisma Singleton
│   ├── auth.ts                    # JWT Admin Session Management
│   ├── utils.ts                   # Format Rupiah & Tanggal Indonesia
│   └── export.ts                  # Export Excel (XLSX) & CSV
├── prisma/schema.prisma           # 16 Tabel Lengkap & Relasi Database
├── supabase/
│   ├── schema.sql                 # DDL SQL Lengkap Supabase
│   └── seed.sql                   # Demo Data Lengkap Supabase
├── scripts/
│   ├── seed.ts                    # Seed CLI
│   └── create-admin.ts            # Skrip Akun Admin
├── public/
│   ├── logo-ad-barbershop.png     # Logo Resmi AD Barbershop (Dark Theme)
│   └── logo-ad-barbershop-light.png # Logo Resmi AD Barbershop (Light/Struk Thermal)
└── package.json
```

---

## 🔒 Keamanan & Praktik Terbaik

- **Password Hashing**: Menggunakan `bcryptjs` salt rounds 10, tidak pernah menyimpan password dalam bentuk teks polos.
- **JWT HTTP-Only Cookie**: Sesi admin disimpan dalam cookie aman yang tidak dapat diakses oleh script browser (anti-XSS).
- **Kerahasiaan Kredensial**: Tidak ada password database atau API key yang dimasukkan ke source code; seluruhnya menggunakan environment variables.

---

© 2026 **AD BARBERSHOP**. All rights reserved.
#   b a r b e r s h o p  
 