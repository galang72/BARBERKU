import { PrismaClient, PaymentMethod, PaymentStatus, ItemType, CashType, BookingStatus, MemberStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai Seed Database AD BARBERSHOP...');

  // 1. Shop Setting
  await prisma.shopSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      shopName: 'AD BARBERSHOP',
      address: 'Jl. Telekomunikasi No.234, Lengkong, Kec. Bojongsoang, Kabupaten Bandung, Jawa Barat 40287',
      phone: '0895-3267-09996',
      receiptHeader: 'Classic Haircut & Professional Grooming',
      receiptFooter: 'Terima Kasih Atas Kunjungan Anda! Tampil Lebih Percaya Diri Bersama AD Barbershop.',
      initialCashFloat: 100000,
    }
  });
  console.log('✅ Shop Settings siap');

  // 2. Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@adbarbershop.com',
      passwordHash,
      name: 'Admin AD Barbershop',
      role: 'ADMIN',
    }
  });
  console.log('✅ Akun Admin: admin@adbarbershop.com / admin123');

  // 3. Barbermen (Arie, Azis, Dani)
  const arie = await prisma.barberman.upsert({
    where: { id: 'brb_arie' },
    update: {},
    create: {
      id: 'brb_arie',
      name: 'Arie',
      nickname: 'Bang Arie',
      phone: '081211112222',
      isActive: true,
    }
  });

  const azis = await prisma.barberman.upsert({
    where: { id: 'brb_azis' },
    update: {},
    create: {
      id: 'brb_azis',
      name: 'Azis',
      nickname: 'Bang Azis',
      phone: '081233334444',
      isActive: true,
    }
  });

  const dani = await prisma.barberman.upsert({
    where: { id: 'brb_dani' },
    update: {},
    create: {
      id: 'brb_dani',
      name: 'Dani',
      nickname: 'Bang Dani',
      phone: '081255556666',
      isActive: true,
    }
  });
  console.log('✅ 3 Barberman (Arie, Azis, Dani) siap');

  // 4. Services
  const servicesData = [
    { id: 'srv_haircut_classic', name: 'Classic Haircut', category: 'HAIRCUT', price: 40000, durationMinutes: 30 },
    { id: 'srv_haircut_premium', name: 'Premium Haircut (Wash + Massage)', category: 'HAIRCUT', price: 60000, durationMinutes: 45 },
    { id: 'srv_kids_haircut', name: 'Kids Haircut', category: 'HAIRCUT', price: 35000, durationMinutes: 25 },
    { id: 'srv_beard_trim', name: 'Beard Trim & Hot Towel Shave', category: 'SHAVE', price: 25000, durationMinutes: 20 },
    { id: 'srv_hair_spa', name: 'Hair Spa & Creambath', category: 'TREATMENT', price: 75000, durationMinutes: 40 },
    { id: 'srv_hair_coloring', name: 'Hair Coloring (Basic Black/Brown)', category: 'COLORING', price: 120000, durationMinutes: 60 },
  ];

  for (const s of servicesData) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }
  console.log('✅ Layanan Barbershop siap');

  // 5. Product Categories
  const categoriesData = [
    { id: 'cat_pomade', name: 'Pomade', slug: 'pomade', description: 'Minyak rambut pria styling rapi' },
    { id: 'cat_tonic', name: 'Tonic', slug: 'tonic', description: 'Tonik penyegar rambut dan kulit kepala' },
    { id: 'cat_powder', name: 'Powder', slug: 'powder', description: 'Styling powder tekstur bervolume' },
    { id: 'cat_shampoo', name: 'Shampoo', slug: 'shampoo', description: 'Shampoo perawatan kulit kepala barbershop' },
    { id: 'cat_hair_clay', name: 'Hair Clay', slug: 'hair-clay', description: 'Clay styling matte finish' },
    { id: 'cat_hair_spray', name: 'Hair Spray', slug: 'hair-spray', description: 'Semprotan pengunci rambut tahan seharian' },
  ];

  for (const c of categoriesData) {
    await prisma.productCategory.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log('✅ Kategori Produk siap');

  // 6. Products
  const productsData = [
    // Pomade
    { id: 'prd_pomade_01', categoryId: 'cat_pomade', sku: 'POM-SUV-01', name: 'Suavecito Matte Pomade 4oz', costPrice: 85000, sellingPrice: 130000, stock: 24, minStock: 5, unit: 'pot' },
    { id: 'prd_pomade_02', categoryId: 'cat_pomade', sku: 'POM-CHF-02', name: 'Chief Solid Black Pomade 4.2oz', costPrice: 90000, sellingPrice: 145000, stock: 18, minStock: 5, unit: 'pot' },
    { id: 'prd_pomade_03', categoryId: 'cat_pomade', sku: 'POM-MRY-03', name: 'Murrays Superior Pomade 3oz', costPrice: 55000, sellingPrice: 85000, stock: 12, minStock: 4, unit: 'pot' },
    { id: 'prd_pomade_04', categoryId: 'cat_pomade', sku: 'POM-GTS-04', name: 'Gatsby Styling Pomade Perfect Hold', costPrice: 25000, sellingPrice: 40000, stock: 30, minStock: 8, unit: 'pot' },
    // Tonic
    { id: 'prd_tonic_01', categoryId: 'cat_tonic', sku: 'TON-HRB-01', name: 'Hair Tonic Herbal Ginseng 200ml', costPrice: 35000, sellingPrice: 60000, stock: 16, minStock: 5, unit: 'botol' },
    { id: 'prd_tonic_02', categoryId: 'cat_tonic', sku: 'TON-MNT-02', name: 'Menthol Cool Refreshing Hair Tonic 250ml', costPrice: 30000, sellingPrice: 55000, stock: 20, minStock: 5, unit: 'botol' },
    // Powder
    { id: 'prd_powder_01', categoryId: 'cat_powder', sku: 'PWD-DST-01', name: 'Dust It Texture Hair Styling Powder 10g', costPrice: 45000, sellingPrice: 80000, stock: 22, minStock: 5, unit: 'botol' },
    { id: 'prd_powder_02', categoryId: 'cat_powder', sku: 'PWD-MAT-02', name: 'Matte Volume Powder Hold Extra 15g', costPrice: 40000, sellingPrice: 75000, stock: 14, minStock: 5, unit: 'botol' },
    // Shampoo
    { id: 'prd_shampoo_01', categoryId: 'cat_shampoo', sku: 'SHM-DAN-01', name: 'Anti-Dandruff Barbershop Shampoo 300ml', costPrice: 35000, sellingPrice: 65000, stock: 4, minStock: 6, unit: 'botol' },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }
  console.log('✅ Produk & Stok siap');

  // 7. Customers (Mendukung 4 macam kasus)
  const customersData = [
    { id: 'cst_01', name: 'Budi', phone: null, instagram: null, totalVisits: 4, totalSpend: 160000, favoriteBarbermanId: arie.id },
    { id: 'cst_02', name: 'Rudi Haryanto', phone: '081234567890', instagram: null, totalVisits: 5, totalSpend: 260000, favoriteBarbermanId: dani.id },
    { id: 'cst_03', name: 'Dimas', phone: null, instagram: '@dimas_barber', totalVisits: 3, totalSpend: 195000, favoriteBarbermanId: azis.id },
    { id: 'cst_04', name: 'Rizky Ramadhan', phone: '081298765432', instagram: '@rizky_ramadhan', totalVisits: 8, totalSpend: 480000, favoriteBarbermanId: arie.id },
    { id: 'cst_05', name: 'Kevin Sanjaya', phone: '085711223344', instagram: '@kevinsanjaya', totalVisits: 6, totalSpend: 410000, favoriteBarbermanId: dani.id },
  ];

  for (const c of customersData) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log('✅ Customer demo (4 skenario nama, phone, instagram) siap');

  // 8. Members
  await prisma.member.upsert({
    where: { memberCode: 'AD-MBR-001' },
    update: {},
    create: {
      id: 'mbr_01',
      customerId: 'cst_04',
      memberCode: 'AD-MBR-001',
      name: 'Rizky Ramadhan',
      phone: '081298765432',
      packageName: 'VIP Barbershop 6 Bulan',
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: MemberStatus.ACTIVE,
      totalVisits: 8,
      totalSpend: 480000,
    }
  });

  await prisma.member.upsert({
    where: { memberCode: 'AD-MBR-002' },
    update: {},
    create: {
      id: 'mbr_02',
      customerId: 'cst_05',
      memberCode: 'AD-MBR-002',
      name: 'Kevin Sanjaya',
      phone: '085711223344',
      packageName: 'Gold Barbershop 3 Bulan',
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: MemberStatus.ACTIVE,
      totalVisits: 6,
      totalSpend: 410000,
    }
  });
  console.log('✅ Member demo siap');

  // 9. Cash Float
  await prisma.cashTransaction.upsert({
    where: { id: 'csh_init_01' },
    update: {},
    create: {
      id: 'csh_init_01',
      type: CashType.CASH_IN,
      category: 'Modal Awal',
      amount: 100000,
      description: 'Kas float awal laci kasir hari ini',
      source: 'MANUAL_IN',
    }
  });
  console.log('✅ Cash Management awal siap');

  console.log('🎉 SEED DATABASE AD BARBERSHOP BERHASIL SELESAI!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
