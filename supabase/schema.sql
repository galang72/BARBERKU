-- ====================================================================
-- AD BARBERSHOP - SUPABASE POSTGRESQL SCHEMA DDL
-- Jalankan skrip ini langsung di Supabase SQL Editor
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QRIS', 'TRANSFER', 'DEBIT', 'KREDIT', 'E_WALLET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ItemType" AS ENUM ('SERVICE', 'PRODUCT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CashType" AS ENUM ('CASH_IN', 'CASH_OUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Users (Hanya Admin)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text), 1, 16)),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role "Role" DEFAULT 'ADMIN'::"Role" NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Barbermen (Data Barberman yang dipilih Admin)
CREATE TABLE IF NOT EXISTS barbermen (
    id TEXT PRIMARY KEY DEFAULT ('brb_' || substr(md5(random()::text), 1, 16)),
    name TEXT NOT NULL,
    nickname TEXT,
    phone TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Customers (Nama WAJIB, Phone & Instagram NULLABLE)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT ('cst_' || substr(md5(random()::text), 1, 16)),
    name TEXT NOT NULL,
    phone TEXT,
    instagram TEXT,
    address TEXT,
    notes TEXT,
    total_visits INT DEFAULT 0 NOT NULL,
    total_spend DOUBLE PRECISION DEFAULT 0 NOT NULL,
    last_visit_at TIMESTAMPTZ,
    favorite_barberman_id TEXT REFERENCES barbermen(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Members
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY DEFAULT ('mbr_' || substr(md5(random()::text), 1, 16)),
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    member_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    package_name TEXT NOT NULL,
    start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status "MemberStatus" DEFAULT 'ACTIVE'::"MemberStatus" NOT NULL,
    total_visits INT DEFAULT 0 NOT NULL,
    total_spend DOUBLE PRECISION DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Services
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY DEFAULT ('srv_' || substr(md5(random()::text), 1, 16)),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'HAIRCUT' NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    duration_minutes INT DEFAULT 30 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY DEFAULT ('cat_' || substr(md5(random()::text), 1, 16)),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT ('prd_' || substr(md5(random()::text), 1, 16)),
    category_id TEXT REFERENCES product_categories(id) ON DELETE SET NULL,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    cost_price DOUBLE PRECISION DEFAULT 0 NOT NULL,
    selling_price DOUBLE PRECISION NOT NULL,
    stock INT DEFAULT 0 NOT NULL,
    min_stock INT DEFAULT 5 NOT NULL,
    supplier TEXT,
    unit TEXT DEFAULT 'pcs' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY DEFAULT ('stk_' || substr(md5(random()::text), 1, 16)),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type "StockMovementType" NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    current_stock INT NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY DEFAULT ('bkg_' || substr(md5(random()::text), 1, 16)),
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    barberman_id TEXT NOT NULL REFERENCES barbermen(id),
    service_id TEXT NOT NULL REFERENCES services(id),
    booking_date TIMESTAMPTZ NOT NULL,
    booking_time TEXT NOT NULL,
    notes TEXT,
    status "BookingStatus" DEFAULT 'PENDING'::"BookingStatus" NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT ('tx_' || substr(md5(random()::text), 1, 16)),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_instagram TEXT,
    barberman_id TEXT NOT NULL REFERENCES barbermen(id),
    subtotal DOUBLE PRECISION DEFAULT 0 NOT NULL,
    discount DOUBLE PRECISION DEFAULT 0 NOT NULL,
    grand_total DOUBLE PRECISION NOT NULL,
    payment_method "PaymentMethod" DEFAULT 'CASH'::"PaymentMethod" NOT NULL,
    payment_status "PaymentStatus" DEFAULT 'PAID'::"PaymentStatus" NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Transaction Items
CREATE TABLE IF NOT EXISTS transaction_items (
    id TEXT PRIMARY KEY DEFAULT ('txi_' || substr(md5(random()::text), 1, 16)),
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    item_type "ItemType" NOT NULL,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    cost_price DOUBLE PRECISION DEFAULT 0 NOT NULL,
    quantity INT DEFAULT 1 NOT NULL,
    subtotal DOUBLE PRECISION NOT NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT ('pay_' || substr(md5(random()::text), 1, 16)),
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    payment_method "PaymentMethod" NOT NULL,
    amount_paid DOUBLE PRECISION NOT NULL,
    change_amount DOUBLE PRECISION DEFAULT 0 NOT NULL,
    payment_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Cash Transactions (Ledger Kas: Cash In & Cash Out)
CREATE TABLE IF NOT EXISTS cash_transactions (
    id TEXT PRIMARY KEY DEFAULT ('csh_' || substr(md5(random()::text), 1, 16)),
    type "CashType" NOT NULL,
    category TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    source TEXT DEFAULT 'MANUAL' NOT NULL,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY DEFAULT ('exp_' || substr(md5(random()::text), 1, 16)),
    category TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    expense_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    payment_method "PaymentMethod" DEFAULT 'CASH'::"PaymentMethod" NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Member Transactions
CREATE TABLE IF NOT EXISTS member_transactions (
    id TEXT PRIMARY KEY DEFAULT ('mtx_' || substr(md5(random()::text), 1, 16)),
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    points_earned INT DEFAULT 0 NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Shop Settings
CREATE TABLE IF NOT EXISTS shop_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    shop_name TEXT DEFAULT 'AD BARBERSHOP' NOT NULL,
    address TEXT DEFAULT 'Jl. Barbershop No. 1, Jakarta' NOT NULL,
    phone TEXT DEFAULT '0895-3267-09996' NOT NULL,
    receipt_header TEXT DEFAULT 'Grooming & Classic Haircut',
    receipt_footer TEXT DEFAULT 'Terima Kasih Atas Kunjungan Anda! Tampil Lebih Percaya Diri Bersama AD Barbershop.',
    initial_cash_float DOUBLE PRECISION DEFAULT 100000 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_instagram ON customers(instagram);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_barberman ON transactions(barberman_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON cash_transactions(type);
