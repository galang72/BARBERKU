-- ====================================================================
-- AD BARBERSHOP - SEED DEMO DATA
-- Jalankan skrip ini di Supabase SQL Editor setelah schema.sql
-- ====================================================================

-- 1. SHOP SETTINGS
INSERT INTO shop_settings (id, shop_name, address, phone, receipt_header, receipt_footer, initial_cash_float)
VALUES (
    'default',
    'AD BARBERSHOP',
    'Jl. Telekomunikasi No.234, Lengkong, Kec. Bojongsoang, Kabupaten Bandung, Jawa Barat 40287',
    '0895-3267-09996',
    'Grooming & Classic Haircut',
    'Terima Kasih Atas Kunjungan Anda! Tampil Lebih Percaya Diri Bersama AD Barbershop.',
    100000
) ON CONFLICT (id) DO UPDATE SET
    shop_name = EXCLUDED.shop_name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone;

-- 2. ADMIN USER (Password: admin123)
INSERT INTO users (id, username, email, password_hash, name, role)
VALUES (
    'usr_admin01',
    'admin',
    'admin@adbarbershop.com',
    '$2a$10$RFpoVcY4Bxwl/xv49yhhh.BJpFllq6AL9TZWBIdua.x8T9TzqhA7O',
    'Admin AD Barbershop',
    'ADMIN'
) ON CONFLICT (username) DO NOTHING;

-- 3. BARBERMEN (Arie, Azis, Dani)
INSERT INTO barbermen (id, name, nickname, phone, is_active) VALUES
('brb_arie', 'Arie', 'Bang Arie', '081211112222', true),
('brb_azis', 'Azis', 'Bang Azis', '081233334444', true),
('brb_dani', 'Dani', 'Bang Dani', '081255556666', true)
ON CONFLICT (id) DO NOTHING;

-- 4. SERVICES
INSERT INTO services (id, name, category, price, duration_minutes, is_active) VALUES
('srv_haircut_classic', 'Classic Haircut', 'HAIRCUT', 40000, 30, true),
('srv_haircut_premium', 'Premium Haircut (Wash + Massage)', 'HAIRCUT', 60000, 45, true),
('srv_kids_haircut', 'Kids Haircut', 'HAIRCUT', 35000, 25, true),
('srv_beard_trim', 'Beard Trim & Hot Towel Shave', 'SHAVE', 25000, 20, true),
('srv_hair_spa', 'Hair Spa & Creambath', 'TREATMENT', 75000, 40, true),
('srv_hair_coloring', 'Hair Coloring (Basic Black/Brown)', 'COLORING', 120000, 60, true),
('srv_hair_bleaching', 'Hair Bleaching & Fashion Color', 'COLORING', 180000, 90, true)
ON CONFLICT (id) DO NOTHING;

-- 5. PRODUCT CATEGORIES
INSERT INTO product_categories (id, name, slug, description) VALUES
('cat_pomade', 'Pomade', 'pomade', 'Minyak rambut pria untuk styling rapi dan tahan lama'),
('cat_tonic', 'Tonic', 'tonic', 'Tonik rambut untuk kesegaran dan menutrisi akar rambut'),
('cat_powder', 'Powder', 'powder', 'Bedak rambut styling untuk tekstur bervolume natural'),
('cat_shampoo', 'Shampoo', 'shampoo', 'Shampoo perawatan rambut dan kulit kepala khusus barbershop'),
('cat_hair_wax', 'Hair Wax', 'hair-wax', 'Lilin penata rambut fleksibel hold tinggi'),
('cat_hair_clay', 'Hair Clay', 'hair-clay', 'Clay matte finish untuk tampilan kasual berantakan rapi'),
('cat_hair_spray', 'Hair Spray', 'hair-spray', 'Semprotan pengunci tatanan rambut tahan seharian'),
('cat_others', 'Produk Lainnya', 'others', 'Aksesoris dan perlengkapan grooming pria')
ON CONFLICT (id) DO NOTHING;

-- 6. PRODUCTS
INSERT INTO products (id, category_id, sku, name, cost_price, selling_price, stock, min_stock, supplier, unit, is_active) VALUES
-- Pomade
('prd_pomade_01', 'cat_pomade', 'POM-SUV-01', 'Suavecito Matte Pomade 4oz', 85000, 130000, 24, 5, 'PT Grooming Supply', 'pot', true),
('prd_pomade_02', 'cat_pomade', 'POM-CHF-02', 'Chief Solid Black Pomade 4.2oz', 90000, 145000, 18, 5, 'Chief Barbershop HQ', 'pot', true),
('prd_pomade_03', 'cat_pomade', 'POM-MRY-03', 'Murrays Superior Pomade 3oz', 55000, 85000, 12, 4, 'PT Dunia Rambut', 'pot', true),
('prd_pomade_04', 'cat_pomade', 'POM-GTS-04', 'Gatsby Styling Pomade Perfect Hold', 25000, 40000, 30, 8, 'Distributor Mandom', 'pot', true),
-- Tonic
('prd_tonic_01', 'cat_tonic', 'TON-HRB-01', 'Hair Tonic Herbal Ginseng 200ml', 35000, 60000, 16, 5, 'CV Natural Barbershop', 'botol', true),
('prd_tonic_02', 'cat_tonic', 'TON-MNT-02', 'Menthol Cool Refreshing Hair Tonic 250ml', 30000, 55000, 20, 5, 'CV Natural Barbershop', 'botol', true),
-- Powder
('prd_powder_01', 'cat_powder', 'PWD-DST-01', 'Dust It Texture Hair Styling Powder 10g', 45000, 80000, 22, 5, 'PT Trend Barbershop', 'botol', true),
('prd_powder_02', 'cat_powder', 'PWD-MAT-02', 'Matte Volume Powder Hold Extra 15g', 40000, 75000, 14, 5, 'PT Trend Barbershop', 'botol', true),
-- Shampoo
('prd_shampoo_01', 'cat_shampoo', 'SHM-DAN-01', 'Anti-Dandruff Barbershop Shampoo 300ml', 35000, 65000, 4, 6, 'CV Barbershop Care', 'botol', true),
('prd_shampoo_02', 'cat_shampoo', 'SHM-CLG-02', 'Cooling Mint Deep Cleansing Shampoo 300ml', 32000, 60000, 15, 5, 'CV Barbershop Care', 'botol', true),
-- Hair Clay
('prd_clay_01', 'cat_hair_clay', 'CLY-MAT-01', 'Matte Clay Extreme Hold & No Shine 100ml', 75000, 120000, 10, 4, 'PT Barber Lab', 'pot', true),
-- Hair Spray
('prd_spray_01', 'cat_hair_spray', 'SPY-EXT-01', 'Extra Strong Lock Hair Spray 250ml', 40000, 70000, 15, 5, 'PT Barber Lab', 'kaleng', true)
ON CONFLICT (id) DO NOTHING;

-- 7. CUSTOMERS (Mendukung 4 skenario data)
INSERT INTO customers (id, name, phone, instagram, address, notes, total_visits, total_spend, last_visit_at, favorite_barberman_id) VALUES
-- Kasus 1: Nama saja
('cst_01', 'Budi', NULL, NULL, NULL, 'Pelanggan walk-in santai', 4, 160000, NOW() - INTERVAL '1 day', 'brb_arie'),
-- Kasus 2: Nama + No HP
('cst_02', 'Rudi Haryanto', '081234567890', NULL, 'Tebet Barat, Jakarta', 'Suka model undercut taper', 5, 260000, NOW() - INTERVAL '2 days', 'brb_dani'),
-- Kasus 3: Nama + Instagram
('cst_03', 'Dimas', NULL, '@dimas_barber', 'Kemang', 'Rambut ikal wavy', 3, 195000, NOW() - INTERVAL '3 days', 'brb_azis'),
-- Kasus 4: Nama + No HP + Instagram
('cst_04', 'Rizky Ramadhan', '081298765432', '@rizky_ramadhan', 'Jl. Fatmawati No. 12', 'Member VIP aktif', 8, 480000, NOW(), 'brb_arie'),
('cst_05', 'Kevin Sanjaya', '085711223344', '@kevinsanjaya', 'Pondok Indah', 'Sering beli pomade Suavecito', 6, 410000, NOW(), 'brb_dani'),
('cst_06', 'Hendra Wijaya', '087812345678', '@hendra.w', 'Cilandak', 'Pelanggan rutin tiap 2 minggu', 7, 350000, NOW() - INTERVAL '4 days', 'brb_azis')
ON CONFLICT (id) DO NOTHING;

-- 8. MEMBERS
INSERT INTO members (id, customer_id, member_code, name, phone, package_name, start_date, end_date, status, total_visits, total_spend) VALUES
('mbr_01', 'cst_04', 'AD-MBR-001', 'Rizky Ramadhan', '081298765432', 'VIP Barbershop 6 Bulan', NOW() - INTERVAL '30 days', NOW() + INTERVAL '150 days', 'ACTIVE', 8, 480000),
('mbr_02', 'cst_05', 'AD-MBR-002', 'Kevin Sanjaya', '085711223344', 'Gold Barbershop 3 Bulan', NOW() - INTERVAL '15 days', NOW() + INTERVAL '75 days', 'ACTIVE', 6, 410000)
ON CONFLICT (id) DO NOTHING;

-- 9. BOOKINGS HARI INI
INSERT INTO bookings (id, customer_id, customer_name, customer_phone, barberman_id, service_id, booking_date, booking_time, notes, status) VALUES
('bkg_01', 'cst_04', 'Rizky Ramadhan', '081298765432', 'brb_arie', 'srv_haircut_premium', CURRENT_DATE, '10:00', 'Potong rambut + keramas', 'COMPLETED'),
('bkg_02', 'cst_05', 'Kevin Sanjaya', '085711223344', 'brb_dani', 'srv_haircut_classic', CURRENT_DATE, '11:30', 'Fade taper rapi', 'COMPLETED'),
('bkg_03', 'cst_02', 'Rudi Haryanto', '081234567890', 'brb_azis', 'srv_beard_trim', CURRENT_DATE, '14:00', 'Merapikan jenggot', 'ARRIVED'),
('bkg_04', NULL, 'Farhan Maulana', '081399887766', 'brb_arie', 'srv_haircut_classic', CURRENT_DATE, '16:00', 'Pelanggan baru', 'CONFIRMED'),
('bkg_05', NULL, 'Gerry Anggara', '085277665544', 'brb_dani', 'srv_hair_spa', CURRENT_DATE, '18:30', 'Perawatan hair spa', 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- 10. CASH TRANSACTIONS (Buku Kas & Modal Awal)
INSERT INTO cash_transactions (id, type, category, amount, description, source, created_at) VALUES
('csh_init_01', 'CASH_IN', 'Modal Awal', 100000, 'Kas float awal laci kasir hari ini', 'MANUAL_IN', CURRENT_DATE + TIME '08:00:00'),
('csh_sale_01', 'CASH_IN', 'Penjualan Kasir', 170000, 'Pembayaran transaksi cash INV-20260926-001', 'POS_SALE', CURRENT_DATE + TIME '10:30:00'),
('csh_sale_02', 'CASH_IN', 'Penjualan Kasir', 120000, 'Pembayaran transaksi cash INV-20260926-002', 'POS_SALE', CURRENT_DATE + TIME '11:45:00'),
('csh_exp_01', 'CASH_OUT', 'Operasional Toko', 75000, 'Beli air mineral galon dan tisu leher barbershop', 'EXPENSE', CURRENT_DATE + TIME '13:00:00'),
('csh_exp_02', 'CASH_OUT', 'Pembelian Stok', 150000, 'Restock darurat razor blade & disinfectant', 'STOCK_PURCHASE', CURRENT_DATE + TIME '15:15:00')
ON CONFLICT (id) DO NOTHING;
