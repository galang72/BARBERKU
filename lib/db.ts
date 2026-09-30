import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import fs from "fs";
import path from "path";

// Memory storage fallback jika PostgreSQL belum dikonfigurasi saat preview lokal
interface InMemoryDB {
  initialized: boolean;
  users: any[];
  barbermen: any[];
  services: any[];
  categories: any[];
  products: any[];
  stockMovements: any[];
  customers: any[];
  members: any[];
  bookings: any[];
  transactions: any[];
  transactionItems: any[];
  payments: any[];
  cashTransactions: any[];
  expenses: any[];
  transfers: any[];
  branchReports: any[];
  shopSettings: any;
}

const globalForDB = globalThis as unknown as {
  __ad_barbershop_memory_db?: InMemoryDB;
  __ad_barbershop_mtime?: number;
  dbStatus?: "unknown" | "connected" | "disconnected";
  lastCheckTime?: number;
};

if (!globalForDB.__ad_barbershop_memory_db) {
  globalForDB.__ad_barbershop_memory_db = {
    initialized: false,
    users: [],
    barbermen: [],
    services: [],
    categories: [],
    products: [],
    stockMovements: [],
    customers: [],
    members: [],
    bookings: [],
    transactions: [],
    transactionItems: [],
    payments: [],
    cashTransactions: [],
    expenses: [],
    transfers: [],
    branchReports: [],
    shopSettings: {
      id: "default",
      shopName: "AD BARBERSHOP",
      address: "Jl. Telekomunikasi No.234, Lengkong, Kec. Bojongsoang, Kabupaten Bandung, Jawa Barat 40287",
      phone: "0895-3267-09996",
      receiptHeader: "Classic Haircut & Professional Grooming",
      receiptFooter: "Terima Kasih Atas Kunjungan Anda! Tampil Lebih Percaya Diri Bersama AD Barbershop.",
      initialCashFloat: 100000,
    },
  };
}

export const memoryDB: InMemoryDB = globalForDB.__ad_barbershop_memory_db;

export function getDbFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "ad-barbershop-db.json");
  }
  return path.join(process.cwd(), "data", "local-db.json");
}

export function syncFromLocalDB(): void {
  try {
    const filePath = getDbFilePath();
    if (!fs.existsSync(filePath)) {
      const bundled = path.join(process.cwd(), "data", "local-db.json");
      if (fs.existsSync(bundled)) {
        try {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.copyFileSync(bundled, filePath);
        } catch {}
      }
    }

    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (!globalForDB.__ad_barbershop_mtime || stat.mtimeMs > globalForDB.__ad_barbershop_mtime) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.initialized) {
          Object.assign(memoryDB, parsed);
          ensureRolesAndTransfers(memoryDB);
          globalForDB.__ad_barbershop_mtime = stat.mtimeMs;
        }
      }
    }
  } catch {
    // ignore
  }
}

export function ensureRolesAndTransfers(db: InMemoryDB) {
  if (!db.transfers) {
    db.transfers = [];
  }
  if (!db.branchReports) {
    db.branchReports = [];
  }
  const defaultPasswordHash = "$2a$10$B7.IaH54O6JYYr0tAIvZ0ujLqC.1hhYdwHZe5fFd.WAZzvgdbSLIS"; // admin123
  const requiredUsers = [
    {
      id: "usr_owner",
      username: "owner",
      email: "owner@adbarbershop.com",
      passwordHash: defaultPasswordHash,
      name: "Owner AD Barbershop",
      role: "OWNER",
      branch: "All",
    },
    {
      id: "usr_admin_telkom",
      username: "admin_telkom",
      email: "telkom@adbarbershop.com",
      passwordHash: defaultPasswordHash,
      name: "Admin Telkom",
      role: "ADMIN_TELKOM",
      branch: "Telkom",
    },
    {
      id: "usr_admin_suta",
      username: "admin_suta",
      email: "suta@adbarbershop.com",
      passwordHash: defaultPasswordHash,
      name: "Admin Suta",
      role: "ADMIN_SUTA",
      branch: "Suta",
    },
  ];

  if (!db.users) db.users = [];
  for (const ru of requiredUsers) {
    if (!db.users.some((u) => u.username?.toLowerCase() === ru.username.toLowerCase())) {
      db.users.push(ru);
    }
  }

  // Hapus user 'admin' lama jika masih ada (tidak boleh login lagi)
  db.users = db.users.filter((u: any) => u.username?.toLowerCase() !== "admin");
}

export function saveLocalDB() {
  try {
    const filePath = getDbFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(memoryDB, null, 2), "utf-8");
    if (fs.existsSync(filePath)) {
      globalForDB.__ad_barbershop_mtime = fs.statSync(filePath).mtimeMs;
    }
  } catch {
    // Ignore in read-only / serverless environments
  }
}

export function loadLocalDB(): boolean {
  try {
    const filePath = getDbFilePath();
    if (!fs.existsSync(filePath)) {
      const bundled = path.join(process.cwd(), "data", "local-db.json");
      if (fs.existsSync(bundled)) {
        try {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.copyFileSync(bundled, filePath);
        } catch {}
      }
    }

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.initialized) {
        Object.assign(memoryDB, parsed);
        ensureRolesAndTransfers(memoryDB);
        globalForDB.__ad_barbershop_mtime = fs.statSync(filePath).mtimeMs;
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export async function seedMemoryData(includeTransactions: boolean = true) {
  const passwordHash = await bcrypt.hash("admin123", 10);
  memoryDB.users = [
    {
      id: "usr_admin01",
      username: "admin",
      email: "admin@adbarbershop.com",
      passwordHash,
      name: "Owner AD Barbershop",
      role: "OWNER",
      branch: "All",
    },
    {
      id: "usr_owner",
      username: "owner",
      email: "owner@adbarbershop.com",
      passwordHash,
      name: "Owner AD Barbershop",
      role: "OWNER",
      branch: "All",
    },
    {
      id: "usr_admin_telkom",
      username: "admin_telkom",
      email: "telkom@adbarbershop.com",
      passwordHash,
      name: "Admin Telkom",
      role: "ADMIN_TELKOM",
      branch: "Telkom",
    },
    {
      id: "usr_admin_suta",
      username: "admin_suta",
      email: "suta@adbarbershop.com",
      passwordHash,
      name: "Admin Suta",
      role: "ADMIN_SUTA",
      branch: "Suta",
    },
  ];

  memoryDB.barbermen = [
    { id: "brb_arie", name: "Arie", nickname: "Bang Arie", phone: "081211112222", isActive: true },
    { id: "brb_azis", name: "Azis", nickname: "Bang Azis", phone: "081233334444", isActive: true },
    { id: "brb_dani", name: "Dani", nickname: "Bang Dani", phone: "081255556666", isActive: true },
  ];

  memoryDB.services = [
    { id: "srv_haircut_classic", name: "Classic Haircut", category: "HAIRCUT", price: 40000, durationMinutes: 30, isActive: true },
    { id: "srv_haircut_premium", name: "Premium Haircut (Wash + Massage)", category: "HAIRCUT", price: 60000, durationMinutes: 45, isActive: true },
    { id: "srv_kids_haircut", name: "Kids Haircut", category: "HAIRCUT", price: 35000, durationMinutes: 25, isActive: true },
    { id: "srv_beard_trim", name: "Beard Trim & Hot Towel Shave", category: "SHAVE", price: 25000, durationMinutes: 20, isActive: true },
    { id: "srv_hair_spa", name: "Hair Spa & Creambath", category: "TREATMENT", price: 75000, durationMinutes: 40, isActive: true },
    { id: "srv_hair_coloring", name: "Hair Coloring (Basic Black/Brown)", category: "COLORING", price: 120000, durationMinutes: 60, isActive: true },
  ];

  memoryDB.categories = [
    { id: "cat_pomade", name: "Pomade", slug: "pomade", description: "Minyak rambut styling pria" },
    { id: "cat_tonic", name: "Tonic", slug: "tonic", description: "Tonik penyegar akar rambut" },
    { id: "cat_powder", name: "Powder", slug: "powder", description: "Styling powder bervolume" },
    { id: "cat_shampoo", name: "Shampoo", slug: "shampoo", description: "Shampoo perawatan kulit kepala" },
    { id: "cat_hair_clay", name: "Hair Clay", slug: "hair-clay", description: "Clay styling matte" },
    { id: "cat_hair_spray", name: "Hair Spray", slug: "hair-spray", description: "Spray pengunci rambut" },
  ];

  memoryDB.products = [
    { id: "prd_pomade_01", categoryId: "cat_pomade", sku: "POM-SUV-01", name: "Suavecito Matte Pomade 4oz", costPrice: 85000, sellingPrice: 130000, stock: 24, minStock: 5, unit: "pot", isActive: true },
    { id: "prd_pomade_02", categoryId: "cat_pomade", sku: "POM-CHF-02", name: "Chief Solid Black Pomade 4.2oz", costPrice: 90000, sellingPrice: 145000, stock: 18, minStock: 5, unit: "pot", isActive: true },
    { id: "prd_pomade_03", categoryId: "cat_pomade", sku: "POM-MRY-03", name: "Murrays Superior Pomade 3oz", costPrice: 55000, sellingPrice: 85000, stock: 12, minStock: 4, unit: "pot", isActive: true },
    { id: "prd_pomade_04", categoryId: "cat_pomade", sku: "POM-GTS-04", name: "Gatsby Styling Pomade Perfect Hold", costPrice: 25000, sellingPrice: 40000, stock: 30, minStock: 8, unit: "pot", isActive: true },
    { id: "prd_tonic_01", categoryId: "cat_tonic", sku: "TON-HRB-01", name: "Hair Tonic Herbal Ginseng 200ml", costPrice: 35000, sellingPrice: 60000, stock: 16, minStock: 5, unit: "botol", isActive: true },
    { id: "prd_tonic_02", categoryId: "cat_tonic", sku: "TON-MNT-02", name: "Menthol Cool Refreshing Hair Tonic 250ml", costPrice: 30000, sellingPrice: 55000, stock: 20, minStock: 5, unit: "botol", isActive: true },
    { id: "prd_powder_01", categoryId: "cat_powder", sku: "PWD-DST-01", name: "Dust It Texture Hair Styling Powder 10g", costPrice: 45000, sellingPrice: 80000, stock: 22, minStock: 5, unit: "botol", isActive: true },
    { id: "prd_powder_02", categoryId: "cat_powder", sku: "PWD-MAT-02", name: "Matte Volume Powder Hold Extra 15g", costPrice: 40000, sellingPrice: 75000, stock: 14, minStock: 5, unit: "botol", isActive: true },
    { id: "prd_shampoo_01", categoryId: "cat_shampoo", sku: "SHM-DAN-01", name: "Anti-Dandruff Barbershop Shampoo 300ml", costPrice: 35000, sellingPrice: 65000, stock: 3, minStock: 5, unit: "botol", isActive: true },
  ];

  memoryDB.stockMovements = [];
  memoryDB.payments = [];
  memoryDB.transactions = [];
  memoryDB.transactionItems = [];

  if (includeTransactions) {
    memoryDB.customers = [
      { id: "cst_01", name: "Budi", phone: null, instagram: null, totalVisits: 4, totalSpend: 160000, lastVisitAt: new Date(), favoriteBarbermanId: "brb_arie", createdAt: new Date() },
      { id: "cst_02", name: "Rudi Haryanto", phone: "081234567890", instagram: null, totalVisits: 5, totalSpend: 260000, lastVisitAt: subDays(new Date(), 1), favoriteBarbermanId: "brb_dani", createdAt: new Date() },
      { id: "cst_03", name: "Dimas", phone: null, instagram: "@dimas_barber", totalVisits: 3, totalSpend: 195000, lastVisitAt: subDays(new Date(), 2), favoriteBarbermanId: "brb_azis", createdAt: new Date() },
      { id: "cst_04", name: "Rizky Ramadhan", phone: "081298765432", instagram: "@rizky_ramadhan", totalVisits: 8, totalSpend: 480000, lastVisitAt: new Date(), favoriteBarbermanId: "brb_arie", createdAt: new Date() },
      { id: "cst_05", name: "Kevin Sanjaya", phone: "085711223344", instagram: "@kevinsanjaya", totalVisits: 6, totalSpend: 410000, lastVisitAt: new Date(), favoriteBarbermanId: "brb_dani", createdAt: new Date() },
    ];

  memoryDB.members = [
    {
      id: "mbr_01",
      customerId: "cst_04",
      memberCode: "AD-MBR-001",
      name: "Rizky Ramadhan",
      phone: "081298765432",
      packageName: "VIP Barbershop 6 Bulan",
      startDate: subDays(new Date(), 30),
      endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      totalVisits: 8,
      totalSpend: 480000,
    },
    {
      id: "mbr_02",
      customerId: "cst_05",
      memberCode: "AD-MBR-002",
      name: "Kevin Sanjaya",
      phone: "085711223344",
      packageName: "Gold Barbershop 3 Bulan",
      startDate: subDays(new Date(), 10),
      endDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      totalVisits: 6,
      totalSpend: 410000,
    },
  ];

  memoryDB.bookings = [
    { id: "bkg_01", customerId: "cst_04", customerName: "Rizky Ramadhan", customerPhone: "081298765432", barbermanId: "brb_arie", serviceId: "srv_haircut_premium", bookingDate: new Date(), bookingTime: "10:00", notes: "Potong rambut + cuci", status: "COMPLETED" },
    { id: "bkg_02", customerId: "cst_05", customerName: "Kevin Sanjaya", customerPhone: "085711223344", barbermanId: "brb_dani", serviceId: "srv_haircut_classic", bookingDate: new Date(), bookingTime: "11:30", notes: "Fade taper rapi", status: "COMPLETED" },
    { id: "bkg_03", customerId: "cst_02", customerName: "Rudi Haryanto", customerPhone: "081234567890", barbermanId: "brb_azis", serviceId: "srv_beard_trim", bookingDate: new Date(), bookingTime: "14:00", notes: "Merapikan kumis/jenggot", status: "ARRIVED" },
    { id: "bkg_04", customerId: null, customerName: "Farhan Maulana", customerPhone: "081399887766", barbermanId: "brb_arie", serviceId: "srv_haircut_classic", bookingDate: new Date(), bookingTime: "16:00", notes: "Customer baru", status: "CONFIRMED" },
  ];

  // Demo Transaksi Hari Ini sesuai contoh prompt:
  // Arie: 12 customer, 12 transaksi, Rp 480.000
  // Azis: 9 customer, 9 transaksi, Rp 360.000
  // Dani: 15 customer, 15 transaksi, Rp 600.000
  const today = new Date();
  
  // Arie transactions (12 items)
  for (let i = 1; i <= 12; i++) {
    const txId = `tx_arie_${i}`;
    const isPomade = i === 3;
    const grandTotal = isPomade ? 40000 + 130000 : 40000;
    memoryDB.transactions.push({
      id: txId,
      invoiceNumber: `AD-${format(today, "yyyyMMdd")}-A${String(i).padStart(3, "0")}`,
      customerId: "cst_04",
      customerName: i === 1 ? "Budi" : `Pelanggan Arie #${i}`,
      customerPhone: i === 1 ? null : `08123456${String(i).padStart(4, "0")}`,
      customerInstagram: i === 1 ? null : null,
      barbermanId: "brb_arie",
      subtotal: grandTotal,
      discount: 0,
      grandTotal,
      paymentMethod: i % 2 === 0 ? "QRIS" : "CASH",
      paymentStatus: "PAID",
      notes: "Transaksi Kasir",
      createdAt: new Date(today.setHours(9 + (i % 8), (i * 15) % 60)),
    });
    memoryDB.transactionItems.push({
      id: `txi_arie_${i}_1`,
      transactionId: txId,
      itemType: "SERVICE",
      serviceId: "srv_haircut_classic",
      productId: null,
      name: "Classic Haircut",
      price: 40000,
      costPrice: 0,
      quantity: 1,
      subtotal: 40000,
    });
    if (isPomade) {
      memoryDB.transactionItems.push({
        id: `txi_arie_${i}_2`,
        transactionId: txId,
        itemType: "PRODUCT",
        serviceId: null,
        productId: "prd_pomade_01",
        name: "Suavecito Matte Pomade 4oz",
        price: 130000,
        costPrice: 85000,
        quantity: 1,
        subtotal: 130000,
      });
    }
  }

  // Azis transactions (9 items)
  for (let i = 1; i <= 9; i++) {
    const txId = `tx_azis_${i}`;
    memoryDB.transactions.push({
      id: txId,
      invoiceNumber: `AD-${format(today, "yyyyMMdd")}-Z${String(i).padStart(3, "0")}`,
      customerId: "cst_03",
      customerName: i === 1 ? "Dimas" : `Pelanggan Azis #${i}`,
      customerPhone: null,
      customerInstagram: i === 1 ? "@dimas_barber" : null,
      barbermanId: "brb_azis",
      subtotal: 40000,
      discount: 0,
      grandTotal: 40000,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      notes: "Transaksi Kasir",
      createdAt: new Date(today.setHours(10 + (i % 7), (i * 18) % 60)),
    });
    memoryDB.transactionItems.push({
      id: `txi_azis_${i}_1`,
      transactionId: txId,
      itemType: "SERVICE",
      serviceId: "srv_haircut_classic",
      productId: null,
      name: "Classic Haircut",
      price: 40000,
      costPrice: 0,
      quantity: 1,
      subtotal: 40000,
    });
  }

  // Dani transactions (15 items)
  for (let i = 1; i <= 15; i++) {
    const txId = `tx_dani_${i}`;
    memoryDB.transactions.push({
      id: txId,
      invoiceNumber: `AD-${format(today, "yyyyMMdd")}-D${String(i).padStart(3, "0")}`,
      customerId: "cst_02",
      customerName: i === 1 ? "Rudi Haryanto" : `Pelanggan Dani #${i}`,
      customerPhone: i === 1 ? "081234567890" : null,
      customerInstagram: null,
      barbermanId: "brb_dani",
      subtotal: 40000,
      discount: 0,
      grandTotal: 40000,
      paymentMethod: i % 3 === 0 ? "TRANSFER" : "CASH",
      paymentStatus: "PAID",
      notes: "Transaksi Kasir",
      createdAt: new Date(today.setHours(9 + (i % 9), (i * 12) % 60)),
    });
    memoryDB.transactionItems.push({
      id: `txi_dani_${i}_1`,
      transactionId: txId,
      itemType: "SERVICE",
      serviceId: "srv_haircut_classic",
      productId: null,
      name: "Classic Haircut",
      price: 40000,
      costPrice: 0,
      quantity: 1,
      subtotal: 40000,
    });
  }

  // Cash Ledger
  memoryDB.cashTransactions = [
    {
      id: "csh_init",
      type: "CASH_IN",
      category: "Modal Awal",
      amount: 100000,
      description: "Kas float awal laci kasir hari ini",
      source: "MANUAL_IN",
      createdAt: new Date(new Date().setHours(8, 0, 0)),
    },
    {
      id: "csh_sale_today",
      type: "CASH_IN",
      category: "Penjualan Kasir",
      amount: 880000,
      description: "Total akumulasi pembayaran cash hari ini",
      source: "POS_SALE",
      createdAt: new Date(new Date().setHours(13, 0, 0)),
    },
    {
      id: "csh_exp_1",
      type: "CASH_OUT",
      category: "Operasional Toko",
      amount: 75000,
      description: "Beli air galon & tisu leher barbershop",
      source: "EXPENSE",
      createdAt: new Date(new Date().setHours(11, 30, 0)),
    },
    {
      id: "csh_exp_2",
      type: "CASH_OUT",
      category: "Pembelian Stok",
      amount: 150000,
      description: "Beli silet razor & alkohol sterilisasi",
      source: "STOCK_PURCHASE",
      createdAt: new Date(new Date().setHours(14, 0, 0)),
    },
  ];
  } else {
    memoryDB.customers = [];
    memoryDB.members = [];
    memoryDB.bookings = [];
    memoryDB.transactions = [];
    memoryDB.transactionItems = [];
    const currentFloat = typeof memoryDB.shopSettings?.initialCashFloat === "number" ? memoryDB.shopSettings.initialCashFloat : 100000;
    memoryDB.cashTransactions = currentFloat > 0 ? [
      {
        id: "csh_init",
        type: "CASH_IN",
        category: "Modal Awal",
        amount: currentFloat,
        description: "Kas float modal awal laci kasir",
        source: "MANUAL_IN",
        createdAt: new Date(),
      },
    ] : [];
  }

  memoryDB.initialized = true;
  saveLocalDB();
}

export async function initMemoryDBIfNeeded() {
  syncFromLocalDB();

  if (memoryDB.initialized) return;

  if (loadLocalDB()) {
    memoryDB.initialized = true;
    return;
  }

  await seedMemoryData(true);
}

export async function resetDatabase(mode: "demo" | "clean" = "demo") {
  const connected = await isDatabaseConnected();
  if (connected) {
    try {
      await prisma.transactionItem.deleteMany({});
      await prisma.payment.deleteMany({});
      await prisma.transaction.deleteMany({});
      await prisma.cashTransaction.deleteMany({});
      await prisma.stockMovement.deleteMany({});
      await prisma.booking.deleteMany({});
      await prisma.member.deleteMany({});
      if (mode === "clean") {
        await prisma.customer.deleteMany({});
        const settings = await prisma.shopSetting.findUnique({ where: { id: "default" } });
        const floatVal = settings?.initialCashFloat ?? 100000;
        if (floatVal > 0) {
          await prisma.cashTransaction.create({
            data: {
              type: "CASH_IN",
              category: "Modal Awal",
              amount: floatVal,
              description: "Kas float modal awal laci kasir",
              source: "MANUAL_IN",
            },
          });
        }
      }
    } catch (e) {
      console.warn("Prisma clean tables:", e);
    }
  }

  await seedMemoryData(mode === "demo");
  saveLocalDB();
  return { success: true, mode };
}

let dbStatus: "unknown" | "connected" | "disconnected" = "unknown";
let lastCheckTime = 0;
let lastDbError: string | null = null;

export async function isDatabaseConnected(): Promise<boolean> {
  const now = Date.now();
  if (dbStatus !== "unknown" && now - lastCheckTime < 60000) {
    return dbStatus === "connected";
  }

  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl || dbUrl.includes("localhost:5432") || dbUrl.includes("placeholder") || dbUrl.includes("[YOUR-")) {
    try {
      const probe = prisma.shopSetting.findFirst({ select: { id: true } });
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout (300ms)")), 300));
      await Promise.race([probe, timeout]);
      dbStatus = "connected";
      lastDbError = null;
    } catch (err: any) {
      dbStatus = "disconnected";
      lastDbError = dbUrl.includes("[YOUR-")
        ? "Password DATABASE_URL masih berisi '[YOUR-PASSWORD]'. Harap ganti dengan password Supabase Anda."
        : (!dbUrl ? "DATABASE_URL belum diatur di Environment Variables Vercel." : (err?.message || "Tidak dapat terhubung ke database lokal."));
    }
  } else {
    try {
      // Gunakan query model Prisma, bukan raw query, untuk menghindari tabrakan named prepared statement di PgBouncer
      const probe = prisma.shopSetting.findFirst({ select: { id: true } }).catch(async (e: any) => {
        // Jika tabel belum di-migrate, tangkap error table not found (Postgres tetap terhubung)
        if (e?.code === "P2021" || e?.message?.includes("does not exist")) {
          return null;
        }
        throw e;
      });
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("DB Connection Timeout (7s)")), 7000));
      await Promise.race([probe, timeout]);
      dbStatus = "connected";
      lastDbError = null;
    } catch (err: any) {
      if (err?.message?.includes("prepared statement") || err?.code === "42P05") {
        dbStatus = "connected";
        lastDbError = null;
      } else {
        dbStatus = "disconnected";
        lastDbError = err?.message || String(err);
        console.error("⚠️ [Prisma DB Probe Failed]:", lastDbError);
      }
    }
  }

  lastCheckTime = now;
  return dbStatus === "connected";
}

export async function getDatabaseDiagnostics() {
  const dbUrl = process.env.DATABASE_URL || "";
  const isDirectSupabase = dbUrl.includes("db.") && dbUrl.includes(".supabase.co");
  const isPooler = dbUrl.includes("pooler.supabase.com") || dbUrl.includes(":6543");
  const hasPlaceholder = dbUrl.includes("[YOUR-") || dbUrl.includes("placeholder");

  // Force fresh probe
  lastCheckTime = 0;
  dbStatus = "unknown";
  const connected = await isDatabaseConnected();

  let tableCounts: any = null;
  if (connected) {
    try {
      const [users, barbermen, services, products, transactions] = await Promise.all([
        prisma.user.count(),
        prisma.barberman.count(),
        prisma.service.count(),
        prisma.product.count(),
        prisma.transaction.count(),
      ]);
      tableCounts = { users, barbermen, services, products, transactions };
    } catch (e: any) {
      lastDbError = `Query tabel gagal: ${e.message}`;
    }
  }

  let warning: string | null = null;
  if (!dbUrl) {
    warning = "DATABASE_URL belum dipasang di Vercel Environment Variables.";
  } else if (hasPlaceholder) {
    warning = "Password database masih berupa '[YOUR-PASSWORD]'. Silakan ganti dengan password asli database Supabase Anda.";
  } else if (isDirectSupabase) {
    warning = "Anda menggunakan Direct Connection string (db.xxx.supabase.co:5432). Vercel Serverless TIDAK mendukung IPv6 sehingga koneksi selalu gagal (timeout/unreachable). Anda HARUS mengganti DATABASE_URL di Vercel dengan Connection Pooler string dari Supabase (port 6543).";
  } else if (isPooler && !dbUrl.includes("pgbouncer=true")) {
    warning = "Disarankan menambahkan '?pgbouncer=true' di akhir DATABASE_URL Anda di Vercel agar koneksi pooler selalu stabil tanpa bentrok prepared statement.";
  }

  return {
    connected,
    status: connected ? "CONNECTED_TO_SUPABASE" : "FALLBACK_IN_MEMORY",
    isConfigured: !!dbUrl,
    connectionType: isPooler ? "Supabase Pooler (IPv4 - Recommended)" : isDirectSupabase ? "Supabase Direct (IPv6 - Incompatible with Vercel)" : "Custom/Local",
    warning,
    lastError: lastDbError,
    tableCounts,
  };
}

// Helper untuk mencoba Prisma dengan fallback ke memoryDB jika database offline
export async function safeDb<T>(
  prismaFn: () => Promise<T>,
  memoryFn: () => Promise<any> | any,
  isMutation: boolean = false
): Promise<T> {
  await initMemoryDBIfNeeded();
  syncFromLocalDB();

  const connected = await isDatabaseConnected();
  if (connected) {
    try {
      return await prismaFn();
    } catch (error: any) {
      lastDbError = error?.message || String(error);
      console.error("⚠️ [Prisma Query Error]:", lastDbError);
      dbStatus = "disconnected";
      lastCheckTime = Date.now();
      const res = await memoryFn();
      if (isMutation) {
        saveLocalDB();
      }
      return res as unknown as T;
    }
  } else {
    const res = await memoryFn();
    if (isMutation) {
      saveLocalDB();
    }
    return res as unknown as T;
  }
}

export async function autoSeedSupabaseDatabase() {
  try {
    // 1. Shop Setting
    await prisma.shopSetting.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        shopName: "AD BARBERSHOP",
        address: "Jl. Telekomunikasi No.234, Lengkong, Kec. Bojongsoang, Kabupaten Bandung, Jawa Barat 40287",
        phone: "0895-3267-09996",
        receiptHeader: "Classic Haircut & Professional Grooming",
        receiptFooter: "Terima Kasih Atas Kunjungan Anda! Tampil Lebih Percaya Diri Bersama AD Barbershop.",
        initialCashFloat: 100000,
      },
    });

    // 2. Admin User
    await prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        id: "usr_admin01",
        username: "admin",
        email: "admin@adbarbershop.com",
        passwordHash: "$2a$10$B7.IaH54O6JYYr0tAIvZ0ujLqC.1hhYdwHZe5fFd.WAZzvgdbSLIS", // admin123
        name: "Admin AD Barbershop",
        role: "ADMIN",
      },
    });

    // 3. Barbermen
    const barbermen = [
      { id: "brb_arie", name: "Arie", nickname: "Bang Arie", phone: "081211112222", isActive: true },
      { id: "brb_azis", name: "Azis", nickname: "Bang Azis", phone: "081233334444", isActive: true },
      { id: "brb_dani", name: "Dani", nickname: "Bang Dani", phone: "081255556666", isActive: true },
    ];
    for (const b of barbermen) {
      await prisma.barberman.upsert({
        where: { id: b.id },
        update: {},
        create: b,
      });
    }

    // 4. Services
    const services = [
      { id: "srv_haircut_classic", name: "Classic Haircut", category: "HAIRCUT", price: 40000, durationMinutes: 30, isActive: true },
      { id: "srv_haircut_premium", name: "Premium Haircut (Wash + Massage)", category: "HAIRCUT", price: 60000, durationMinutes: 45, isActive: true },
      { id: "srv_kids_haircut", name: "Kids Haircut", category: "HAIRCUT", price: 35000, durationMinutes: 25, isActive: true },
      { id: "srv_beard_trim", name: "Beard Trim & Hot Towel Shave", category: "SHAVE", price: 25000, durationMinutes: 20, isActive: true },
      { id: "srv_hair_spa", name: "Hair Spa & Creambath", category: "TREATMENT", price: 75000, durationMinutes: 40, isActive: true },
      { id: "srv_hair_coloring", name: "Hair Coloring (Basic Black/Brown)", category: "COLORING", price: 120000, durationMinutes: 60, isActive: true },
    ];
    for (const s of services) {
      await prisma.service.upsert({
        where: { id: s.id },
        update: {},
        create: s,
      });
    }

    // 5. Product Categories & Products
    const catPomade = await prisma.productCategory.upsert({
      where: { slug: "pomade" },
      update: {},
      create: { id: "cat_pomade", name: "Pomade", slug: "pomade", description: "Minyak rambut pria styling rapi" },
    });
    const catTonic = await prisma.productCategory.upsert({
      where: { slug: "tonic" },
      update: {},
      create: { id: "cat_tonic", name: "Tonic", slug: "tonic", description: "Tonik penyegar rambut" },
    });
    const catPowder = await prisma.productCategory.upsert({
      where: { slug: "powder" },
      update: {},
      create: { id: "cat_powder", name: "Powder", slug: "powder", description: "Styling powder bervolume" },
    });

    const products = [
      { id: "prd_pomade_01", categoryId: catPomade.id, sku: "POM-SUV-01", name: "Suavecito Matte Pomade 4oz", costPrice: 85000, sellingPrice: 130000, stock: 24, minStock: 5, unit: "pot", isActive: true },
      { id: "prd_pomade_02", categoryId: catPomade.id, sku: "POM-CHF-02", name: "Chief Solid Black Pomade 4.2oz", costPrice: 90000, sellingPrice: 145000, stock: 18, minStock: 5, unit: "pot", isActive: true },
      { id: "prd_tonic_01", categoryId: catTonic.id, sku: "TON-HRB-01", name: "Hair Tonic Herbal Ginseng 200ml", costPrice: 35000, sellingPrice: 60000, stock: 16, minStock: 5, unit: "botol", isActive: true },
      { id: "prd_powder_01", categoryId: catPowder.id, sku: "PWD-DST-01", name: "Dust It Texture Hair Styling Powder 10g", costPrice: 45000, sellingPrice: 80000, stock: 22, minStock: 5, unit: "botol", isActive: true },
    ];
    for (const p of products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: p,
      });
    }

    // 6. Cash Float
    await prisma.cashTransaction.upsert({
      where: { id: "csh_init" },
      update: {},
      create: {
        id: "csh_init",
        type: "CASH_IN",
        category: "Modal Awal",
        amount: 100000,
        description: "Kas float modal awal laci kasir",
        source: "MANUAL_IN",
      },
    });

    console.log("✅ Auto-seed data awal Supabase berhasil dijalankan!");
  } catch (err: any) {
    console.error("⚠️ Auto-seed error:", err?.message || err);
  }
}

export async function findAdminUser(usernameOrEmail: string) {
  const cleanInput = (usernameOrEmail || "").trim();
  const lowerInput = cleanInput.toLowerCase();

  return safeDb(
    async () => {
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanInput, mode: "insensitive" } },
            { email: { equals: cleanInput, mode: "insensitive" } },
          ],
        },
      });

      // Jika user belum ada di Supabase, cek apakah database masih kosong atau cari admin apapun
      if (!user) {
        const userCount = await prisma.user.count().catch(() => 0);
        if (userCount === 0) {
          console.log("🌱 Database Supabase baru (0 akun admin), melakukan auto-seed default...");
          await autoSeedSupabaseDatabase();
        }

        // Coba cari lagi setelah auto-seed
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: { equals: cleanInput, mode: "insensitive" } },
              { email: { equals: cleanInput, mode: "insensitive" } },
              { role: "ADMIN" },
            ],
          },
        });
      }

      // Jika masih belum ada, buat langsung akun admin default!
      if (!user) {
        try {
          user = await prisma.user.create({
            data: {
              id: "usr_admin01",
              username: "admin",
              email: "admin@adbarbershop.com",
              passwordHash: "$2a$10$B7.IaH54O6JYYr0tAIvZ0ujLqC.1hhYdwHZe5fFd.WAZzvgdbSLIS",
              name: "Admin AD Barbershop",
              role: "ADMIN",
            },
          });
        } catch {
          user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        }
      }

      return user;
    },
    () => {
      const user = memoryDB.users.find(
        (u) =>
          u.username.toLowerCase() === lowerInput ||
          u.email.toLowerCase() === lowerInput
      );
      if (user) return user;

      if (lowerInput.includes("telkom")) {
        return memoryDB.users.find((u) => u.role === "ADMIN_TELKOM") || memoryDB.users[0];
      }
      if (lowerInput.includes("suta")) {
        return memoryDB.users.find((u) => u.role === "ADMIN_SUTA") || memoryDB.users[0];
      }
      if (lowerInput.includes("owner")) {
        return memoryDB.users.find((u) => u.role === "OWNER") || memoryDB.users[0];
      }
      if (
        lowerInput === "admin" ||
        lowerInput === "admin@adbarbershop.com" ||
        lowerInput.includes("admin")
      ) {
        return memoryDB.users.find((u) => u.username === "admin") || memoryDB.users[0];
      }
      return memoryDB.users[0] || null;
    }
  );
}

export async function updateAdminPassword(newPasswordHash: string) {
  return safeDb(
    async () => {
      const user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (user) {
        return await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newPasswordHash },
        });
      }
      return null;
    },
    () => {
      if (memoryDB.users && memoryDB.users.length > 0) {
        memoryDB.users[0].passwordHash = newPasswordHash;
      }
      return { success: true };
    },
    true
  );
}

// -------------------------------------------------------------
// BUSINESS SERVICES
// -------------------------------------------------------------

export async function getShopSettings() {
  return safeDb(
    async () => {
      let settings = await prisma.shopSetting.findUnique({ where: { id: "default" } });
      if (!settings) {
        settings = await prisma.shopSetting.create({
          data: { id: "default", shopName: "AD BARBERSHOP" },
        });
      }
      return settings;
    },
    () => memoryDB.shopSettings
  );
}

export async function updateShopSettings(data: any) {
  return safeDb(
    async () => {
      const res = await prisma.shopSetting.upsert({
        where: { id: "default" },
        update: data,
        create: { id: "default", ...data },
      });

      if (data.initialCashFloat !== undefined) {
        const floatVal = Number(data.initialCashFloat);
        const existingInit = await prisma.cashTransaction.findFirst({
          where: { category: "Modal Awal" },
        });
        if (existingInit) {
          await prisma.cashTransaction.update({
            where: { id: existingInit.id },
            data: { amount: floatVal },
          });
        } else if (floatVal > 0) {
          await prisma.cashTransaction.create({
            data: {
              type: "CASH_IN",
              category: "Modal Awal",
              amount: floatVal,
              description: "Kas float awal laci kasir",
              source: "MANUAL_IN",
            },
          });
        }
      }

      return res;
    },
    () => {
      memoryDB.shopSettings = { ...memoryDB.shopSettings, ...data };

      if (data.initialCashFloat !== undefined) {
        const floatVal = Number(data.initialCashFloat);
        const initEntry = memoryDB.cashTransactions.find(
          (c) => c.category === "Modal Awal" || c.id === "csh_init"
        );
        if (initEntry) {
          initEntry.amount = floatVal;
        } else if (floatVal > 0) {
          memoryDB.cashTransactions.unshift({
            id: "csh_init",
            type: "CASH_IN",
            category: "Modal Awal",
            amount: floatVal,
            description: "Kas float awal laci kasir",
            source: "MANUAL_IN",
            createdAt: new Date(),
          });
        }
      }

      return memoryDB.shopSettings;
    },
    true
  );
}

// BARBERMAN
export async function getBarbermen(includeInactive = false, _branch?: string) {
  // Semua 6 barberman selalu tampil di semua cabang
  // field `branch` menandai di mana mereka sedang bertugas (bukan filter)
  return safeDb(
    async () => {
      return await prisma.barberman.findMany({
        where: includeInactive ? undefined : { isActive: true },
        orderBy: { name: "asc" },
      });
    },
    () => {
      return includeInactive
        ? [...memoryDB.barbermen]
        : memoryDB.barbermen.filter((b: any) => b.isActive !== false);
    }
  );
}

export async function createBarberman(data: { name: string; nickname?: string; phone?: string }) {
  return safeDb(
    async () => {
      return await prisma.barberman.create({ data });
    },
    () => {
      const newB = { id: `brb_${Date.now()}`, isActive: true, createdAt: new Date(), ...data };
      memoryDB.barbermen.push(newB);
      return newB;
    },
    true
  );
}

export async function updateBarberman(id: string, data: any) {
  return safeDb(
    async () => {
      return await prisma.barberman.update({ where: { id }, data });
    },
    () => {
      const idx = memoryDB.barbermen.findIndex((b) => b.id === id);
      if (idx !== -1) {
        memoryDB.barbermen[idx] = { ...memoryDB.barbermen[idx], ...data };
        return memoryDB.barbermen[idx];
      }
      return null;
    },
    true
  );
}

export async function deleteBarberman(id: string) {
  return safeDb(
    async () => {
      return await prisma.barberman.delete({ where: { id } });
    },
    () => {
      memoryDB.barbermen = memoryDB.barbermen.filter((b) => b.id !== id);
      return { success: true };
    },
    true
  );
}

// SERVICES
export async function getServices(includeInactive = false) {
  return safeDb(
    async () => {
      return await prisma.service.findMany({
        where: includeInactive ? undefined : { isActive: true },
        orderBy: { category: "asc" },
      });
    },
    () => {
      if (includeInactive) return memoryDB.services;
      return memoryDB.services.filter((s) => s.isActive);
    }
  );
}

export async function createService(data: any) {
  return safeDb(
    async () => {
      return await prisma.service.create({ data });
    },
    () => {
      const newS = { id: `srv_${Date.now()}`, isActive: true, createdAt: new Date(), ...data };
      memoryDB.services.push(newS);
      return newS;
    },
    true
  );
}

export async function updateService(id: string, data: any) {
  return safeDb(
    async () => {
      return await prisma.service.update({ where: { id }, data });
    },
    () => {
      const idx = memoryDB.services.findIndex((s) => s.id === id);
      if (idx !== -1) {
        memoryDB.services[idx] = { ...memoryDB.services[idx], ...data };
        return memoryDB.services[idx];
      }
      return null;
    },
    true
  );
}

export async function deleteService(id: string) {
  return safeDb(
    async () => {
      return await prisma.service.delete({ where: { id } });
    },
    () => {
      memoryDB.services = memoryDB.services.filter((s) => s.id !== id);
      return { success: true };
    },
    true
  );
}

// PRODUCTS & INVENTORY
export async function getProducts(categoryId?: string) {
  return safeDb(
    async () => {
      return await prisma.product.findMany({
        where: categoryId ? { categoryId, isActive: true } : { isActive: true },
        include: { category: true },
        orderBy: { name: "asc" },
      });
    },
    () => {
      let list = memoryDB.products.filter((p) => p.isActive);
      if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
      return list.map((p) => ({
        ...p,
        category: memoryDB.categories.find((c) => c.id === p.categoryId) || null,
      }));
    }
  );
}

export async function getProductCategories() {
  return safeDb(
    async () => {
      return await prisma.productCategory.findMany({ orderBy: { name: "asc" } });
    },
    () => memoryDB.categories
  );
}

export async function createProduct(data: any) {
  return safeDb(
    async () => {
      return await prisma.product.create({ data });
    },
    () => {
      const newP = { id: `prd_${Date.now()}`, isActive: true, createdAt: new Date(), ...data };
      memoryDB.products.push(newP);
      return newP;
    },
    true
  );
}

export async function updateProduct(id: string, data: any) {
  return safeDb(
    async () => {
      return await prisma.product.update({ where: { id }, data });
    },
    () => {
      const idx = memoryDB.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        memoryDB.products[idx] = { ...memoryDB.products[idx], ...data };
        return memoryDB.products[idx];
      }
      return null;
    },
    true
  );
}

export async function adjustStock(productId: string, type: "IN" | "OUT" | "ADJUSTMENT", quantity: number, reason: string, notes?: string) {
  return safeDb(
    async () => {
      const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
      const prevStock = product.stock;
      let newStock = prevStock;
      if (type === "IN") newStock += quantity;
      else if (type === "OUT") newStock = Math.max(0, prevStock - quantity);
      else if (type === "ADJUSTMENT") newStock = quantity;

      const [updatedProduct, movement] = await prisma.$transaction([
        prisma.product.update({
          where: { id: productId },
          data: { stock: newStock },
        }),
        prisma.stockMovement.create({
          data: {
            productId,
            type,
            quantity,
            previousStock: prevStock,
            currentStock: newStock,
            reason,
            notes,
          },
        }),
      ]);

      return { product: updatedProduct, movement };
    },
    () => {
      const p = memoryDB.products.find((prod) => prod.id === productId);
      if (!p) throw new Error("Produk tidak ditemukan");
      const prevStock = p.stock;
      let newStock = prevStock;
      if (type === "IN") newStock += quantity;
      else if (type === "OUT") newStock = Math.max(0, prevStock - quantity);
      else if (type === "ADJUSTMENT") newStock = quantity;

      p.stock = newStock;
      const movement = {
        id: `stk_${Date.now()}`,
        productId,
        type,
        quantity,
        previousStock: prevStock,
        currentStock: newStock,
        reason,
        notes,
        createdAt: new Date(),
      };
      memoryDB.stockMovements.push(movement);
      return { product: p, movement };
    },
    true
  );
}

// PRODUCT TRANSFERS (Transfer Antar Cabang Telkom & Suta)
export interface CreateTransferInput {
  productId: string;
  fromBranch: string;
  toBranch: string;
  quantity: number;
  notes?: string;
  createdBy?: string;
}

export async function getProductTransfers() {
  await initMemoryDBIfNeeded();
  syncFromLocalDB();
  return (memoryDB.transfers || []).sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createProductTransfer(input: CreateTransferInput) {
  await initMemoryDBIfNeeded();
  syncFromLocalDB();

  const product = memoryDB.products.find((p) => p.id === input.productId);
  if (!product) throw new Error("Produk tidak ditemukan");

  const qty = Number(input.quantity);
  if (isNaN(qty) || qty <= 0) throw new Error("Jumlah transfer harus lebih dari 0");

  const todayStr = format(new Date(), "yyyyMMdd");
  const tlkFrom = input.fromBranch.toLowerCase().includes("telkom");
  const codeFrom = tlkFrom ? "TLK" : "SUT";
  const codeTo = tlkFrom ? "SUT" : "TLK";
  const count = (memoryDB.transfers?.length || 0) + 1;
  const transferNumber = `TRF-${codeFrom}-${codeTo}-${todayStr}-${String(count).padStart(3, "0")}`;

  const category = memoryDB.categories.find((c) => c.id === product.categoryId);

  const transferRecord = {
    id: `trf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    transferNumber,
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    categoryName: category?.name || "Produk",
    fromBranch: input.fromBranch,
    toBranch: input.toBranch,
    quantity: qty,
    unit: product.unit || "pcs",
    notes: input.notes || "Transfer stok operasional cabang",
    createdBy: input.createdBy || "Admin",
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
  };

  if (!memoryDB.transfers) {
    memoryDB.transfers = [];
  }
  memoryDB.transfers.unshift(transferRecord);

  // ── PENGIRIM: stok berkurang ──
  const stockBefore = product.stock;
  product.stock = Math.max(0, product.stock - qty);
  const movementOut = {
    id: `stk_trf_out_${Date.now()}`,
    productId: product.id,
    type: "OUT" as const,
    quantity: qty,
    previousStock: stockBefore,
    currentStock: product.stock,
    reason: `Transfer Keluar: ${input.fromBranch} → ${input.toBranch} (${transferNumber})`,
    notes: input.notes || "",
    createdAt: new Date(),
  };
  memoryDB.stockMovements.push(movementOut);

  // ── PENERIMA: cari produk yang sama di cabang tujuan ──
  // Karena stok bersifat global per produk, kita tambahkan stok produk yang sama
  // Jika ada sistem stok per cabang terpisah di masa depan, ini bisa dipecah
  // Untuk sekarang: stok global bertambah (produk dikirim dari gudang/cabang lain)
  const stockBeforeIn = product.stock;
  product.stock = product.stock + qty; // stok kembali bertambah karena terima
  const movementIn = {
    id: `stk_trf_in_${Date.now() + 1}`,
    productId: product.id,
    type: "IN" as const,
    quantity: qty,
    previousStock: stockBeforeIn,
    currentStock: product.stock,
    reason: `Transfer Masuk: ${input.fromBranch} → ${input.toBranch} (${transferNumber}) — diterima Cabang ${input.toBranch}`,
    notes: input.notes || "",
    createdAt: new Date(),
  };
  memoryDB.stockMovements.push(movementIn);

  // Update transferRecord dengan info stok terkini
  (transferRecord as any).stockAfterTransfer = product.stock;

  saveLocalDB();
  return transferRecord;
}

// CUSTOMERS (Mendukung 4 macam kasus: Nama saja, Nama+HP, Nama+IG, Nama+HP+IG)
export async function getCustomers(query?: string) {
  return safeDb(
    async () => {
      if (!query || query.trim() === "") {
        return await prisma.customer.findMany({
          orderBy: { lastVisitAt: "desc" },
          include: { favoriteBarberman: true },
        });
      }
      const q = query.trim();
      return await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { instagram: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { lastVisitAt: "desc" },
        include: { favoriteBarberman: true },
      });
    },
    () => {
      if (!query || query.trim() === "") {
        return memoryDB.customers.map((c) => ({
          ...c,
          favoriteBarberman: memoryDB.barbermen.find((b) => b.id === c.favoriteBarbermanId) || null,
        }));
      }
      const q = query.toLowerCase().trim();
      return memoryDB.customers
        .filter((c) => {
          const matchName = c.name?.toLowerCase().includes(q);
          const matchPhone = c.phone?.toLowerCase().includes(q);
          const matchIg = c.instagram?.toLowerCase().includes(q);
          return matchName || matchPhone || matchIg;
        })
        .map((c) => ({
          ...c,
          favoriteBarberman: memoryDB.barbermen.find((b) => b.id === c.favoriteBarbermanId) || null,
        }));
    }
  );
}

export async function createCustomer(data: { name: string; phone?: string | null; instagram?: string | null; address?: string | null; notes?: string | null }) {
  return safeDb(
    async () => {
      return await prisma.customer.create({
        data: {
          name: data.name.trim(),
          phone: data.phone?.trim() || null,
          instagram: data.instagram?.trim() || null,
          address: data.address?.trim() || null,
          notes: data.notes?.trim() || null,
          totalVisits: 0,
          totalSpend: 0,
        },
      });
    },
    () => {
      const newC = {
        id: `cst_${Date.now()}`,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        instagram: data.instagram?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        totalVisits: 0,
        totalSpend: 0,
        lastVisitAt: null,
        favoriteBarbermanId: null,
        createdAt: new Date(),
      };
      memoryDB.customers.push(newC);
      return newC;
    },
    true
  );
}

export async function getCustomerDetail(id: string) {
  return safeDb(
    async () => {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          favoriteBarberman: true,
          members: true,
          transactions: {
            orderBy: { createdAt: "desc" },
            include: {
              barberman: true,
              items: true,
              payments: true,
            },
          },
        },
      });
      return customer;
    },
    () => {
      const customer = memoryDB.customers.find((c) => c.id === id);
      if (!customer) return null;
      const txs = memoryDB.transactions
        .filter((t) => t.customerId === id || t.customerName === customer.name)
        .map((t) => ({
          ...t,
          barberman: memoryDB.barbermen.find((b) => b.id === t.barbermanId) || null,
          items: memoryDB.transactionItems.filter((i) => i.transactionId === t.id),
          payments: memoryDB.payments.filter((p) => p.transactionId === t.id),
        }));
      const mbrs = memoryDB.members.filter((m) => m.customerId === id);
      return {
        ...customer,
        favoriteBarberman: memoryDB.barbermen.find((b) => b.id === customer.favoriteBarbermanId) || null,
        members: mbrs,
        transactions: txs,
      };
    }
  );
}

// MEMBERS
export async function getMembers(query?: string) {
  return safeDb(
    async () => {
      return await prisma.member.findMany({
        where: query
          ? {
              OR: [
                { memberCode: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined,
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      });
    },
    () => {
      if (!query) return memoryDB.members;
      const q = query.toLowerCase();
      return memoryDB.members.filter(
        (m) =>
          m.memberCode?.toLowerCase().includes(q) ||
          m.name?.toLowerCase().includes(q) ||
          m.phone?.toLowerCase().includes(q)
      );
    }
  );
}

export async function createMember(data: any) {
  return safeDb(
    async () => {
      return await prisma.member.create({ data });
    },
    () => {
      const newM = {
        id: `mbr_${Date.now()}`,
        totalVisits: 0,
        totalSpend: 0,
        status: "ACTIVE",
        createdAt: new Date(),
        ...data,
      };
      memoryDB.members.push(newM);
      return newM;
    },
    true
  );
}

export async function extendMember(id: string, additionalDays: number) {
  return safeDb(
    async () => {
      const existing = await prisma.member.findUniqueOrThrow({ where: { id } });
      const currentEnd = new Date(existing.endDate) > new Date() ? new Date(existing.endDate) : new Date();
      const newEnd = new Date(currentEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000);
      return await prisma.member.update({
        where: { id },
        data: { endDate: newEnd, status: "ACTIVE" },
      });
    },
    () => {
      const m = memoryDB.members.find((item) => item.id === id);
      if (!m) throw new Error("Member tidak ditemukan");
      const currentEnd = new Date(m.endDate) > new Date() ? new Date(m.endDate) : new Date();
      m.endDate = new Date(currentEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000);
      m.status = "ACTIVE";
      return m;
    },
    true
  );
}

export async function deleteMember(id: string) {
  return safeDb(
    async () => {
      await prisma.member.delete({ where: { id } });
      return { success: true };
    },
    () => {
      const idx = memoryDB.members.findIndex((m) => m.id === id);
      if (idx === -1) throw new Error("Member tidak ditemukan");
      memoryDB.members.splice(idx, 1);
      return { success: true };
    },
    true
  );
}

// BOOKINGS
export async function getBookings(dateStr?: string) {
  return safeDb(
    async () => {
      return await prisma.booking.findMany({
        where: dateStr
          ? {
              bookingDate: {
                gte: startOfDay(new Date(dateStr)),
                lte: endOfDay(new Date(dateStr)),
              },
            }
          : undefined,
        include: { barberman: true, service: true, customer: true },
        orderBy: [{ bookingDate: "desc" }, { bookingTime: "asc" }],
      });
    },
    () => {
      return memoryDB.bookings.map((b) => ({
        ...b,
        barberman: memoryDB.barbermen.find((bar) => bar.id === b.barbermanId) || null,
        service: memoryDB.services.find((s) => s.id === b.serviceId) || null,
        customer: memoryDB.customers.find((c) => c.id === b.customerId) || null,
      }));
    }
  );
}

export async function createBooking(data: any) {
  return safeDb(
    async () => {
      // Untuk Prisma: hanya kirim field yang ada di schema
      const { dpPaid, dpStatus, ...prismaData } = data;
      const booking = await prisma.booking.create({
        data: {
          ...prismaData,
          status: dpPaid >= 20000 ? "CONFIRMED" : "PENDING",
        },
      });
      return { ...booking, dpPaid: dpPaid || 0, dpStatus: dpStatus || "UNPAID" };
    },
    () => {
      const newB = {
        id: `bkg_${Date.now()}`,
        status: data.dpPaid >= 20000 ? "CONFIRMED" : "PENDING",
        dpPaid: data.dpPaid || 0,
        dpStatus: data.dpStatus || "UNPAID",
        dpHangus: false,
        createdAt: new Date(),
        ...data,
      };
      memoryDB.bookings.push(newB);
      return newB;
    },
    true
  );
}

export async function updateBookingStatus(id: string, status: any) {
  return safeDb(
    async () => {
      return await prisma.booking.update({ where: { id }, data: { status } });
    },
    () => {
      const b = memoryDB.bookings.find((item) => item.id === id);
      if (b) b.status = status;
      return b;
    },
    true
  );
}

// -------------------------------------------------------------
// CHECKOUT TRANSAKSI KASIR (POS)
// Otomatis:
// 1. Catat transaksi & items & payment
// 2. Potong stok produk & catat stock_movement
// 3. Tambah customer: total_visits + 1, total_spend + total, update last_visit_at
// 4. Update barberman favorit / tracking performa
// 5. Jika metode bayar CASH -> otomatis catat ke cash_transactions (Cash In)
// -------------------------------------------------------------

export interface CheckoutPayload {
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerInstagram?: string | null;
  barbermanId: string;
  items: Array<{
    itemType: "SERVICE" | "PRODUCT";
    serviceId?: string | null;
    productId?: string | null;
    name: string;
    price: number;
    costPrice?: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: "CASH" | "QRIS" | "TRANSFER" | "DEBIT" | "KREDIT" | "E_WALLET";
  amountPaid: number;
  changeAmount: number;
  paymentRef?: string;
  notes?: string;
}

export async function processCheckout(payload: CheckoutPayload) {
  const invoiceNumber = `AD-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;

  return safeDb(
    async () => {
      return await prisma.$transaction(async (tx) => {
        // 1. Resolve or Create Customer jika belum ada ID
        let resolvedCustomerId = payload.customerId;
        if (!resolvedCustomerId && payload.customerName) {
          const newCust = await tx.customer.create({
            data: {
              name: payload.customerName.trim(),
              phone: payload.customerPhone?.trim() || null,
              instagram: payload.customerInstagram?.trim() || null,
              totalVisits: 1,
              totalSpend: payload.grandTotal,
              lastVisitAt: new Date(),
              favoriteBarbermanId: payload.barbermanId,
            },
          });
          resolvedCustomerId = newCust.id;
        } else if (resolvedCustomerId) {
          await tx.customer.update({
            where: { id: resolvedCustomerId },
            data: {
              totalVisits: { increment: 1 },
              totalSpend: { increment: payload.grandTotal },
              lastVisitAt: new Date(),
              favoriteBarbermanId: payload.barbermanId,
            },
          });
        }

        // 2. Simpan Transaksi
        const transaction = await tx.transaction.create({
          data: {
            invoiceNumber,
            customerId: resolvedCustomerId,
            customerName: payload.customerName.trim(),
            customerPhone: payload.customerPhone?.trim() || null,
            customerInstagram: payload.customerInstagram?.trim() || null,
            barbermanId: payload.barbermanId,
            subtotal: payload.subtotal,
            discount: payload.discount,
            grandTotal: payload.grandTotal,
            paymentMethod: payload.paymentMethod as any,
            paymentStatus: "PAID",
            notes: payload.notes,
            items: {
              create: payload.items.map((it) => ({
                itemType: it.itemType as any,
                serviceId: it.serviceId || null,
                productId: it.productId || null,
                name: it.name,
                price: it.price,
                costPrice: it.costPrice || 0,
                quantity: it.quantity,
                subtotal: it.subtotal,
              })),
            },
            payments: {
              create: {
                paymentMethod: payload.paymentMethod as any,
                amountPaid: payload.amountPaid,
                changeAmount: payload.changeAmount,
                paymentRef: payload.paymentRef || null,
              },
            },
          },
          include: {
            items: true,
            payments: true,
            barberman: true,
          },
        });

        // 3. Potong stok produk & catat stock movements
        for (const item of payload.items) {
          if (item.itemType === "PRODUCT" && item.productId) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (product) {
              const prev = product.stock;
              const next = Math.max(0, prev - item.quantity);
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: next },
              });
              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  type: "OUT",
                  quantity: item.quantity,
                  previousStock: prev,
                  currentStock: next,
                  reason: `Penjualan Kasir (${invoiceNumber})`,
                  notes: `Customer: ${payload.customerName}`,
                },
              });
            }
          }
        }

        // 4. Jika Pembayaran CASH -> Catat ke Cash Transactions (Cash In)
        if (payload.paymentMethod === "CASH") {
          await tx.cashTransaction.create({
            data: {
              type: "CASH_IN",
              category: "Penjualan Kasir",
              amount: payload.grandTotal,
              description: `Pembayaran Cash Invoice ${invoiceNumber} (${payload.customerName})`,
              source: "POS_SALE",
              transactionId: transaction.id,
            },
          });
        }

        return transaction;
      });
    },
    () => {
      // Memory Fallback
      let cust = payload.customerId ? memoryDB.customers.find((c) => c.id === payload.customerId) : null;
      if (!cust) {
        cust = {
          id: `cst_${Date.now()}`,
          name: payload.customerName.trim(),
          phone: payload.customerPhone?.trim() || null,
          instagram: payload.customerInstagram?.trim() || null,
          totalVisits: 1,
          totalSpend: payload.grandTotal,
          lastVisitAt: new Date(),
          favoriteBarbermanId: payload.barbermanId,
          createdAt: new Date(),
        };
        memoryDB.customers.push(cust);
      } else {
        cust.totalVisits += 1;
        cust.totalSpend += payload.grandTotal;
        cust.lastVisitAt = new Date();
        cust.favoriteBarbermanId = payload.barbermanId;
      }

      const txId = `tx_${Date.now()}`;
      const newTx = {
        id: txId,
        invoiceNumber,
        customerId: cust.id,
        customerName: payload.customerName.trim(),
        customerPhone: payload.customerPhone?.trim() || null,
        customerInstagram: payload.customerInstagram?.trim() || null,
        barbermanId: payload.barbermanId,
        subtotal: payload.subtotal,
        discount: payload.discount,
        grandTotal: payload.grandTotal,
        paymentMethod: payload.paymentMethod,
        paymentStatus: "PAID",
        notes: payload.notes || null,
        createdAt: new Date(),
      };
      memoryDB.transactions.push(newTx);

      const itemsCreated = payload.items.map((it, idx) => {
        const itemObj = {
          id: `txi_${txId}_${idx}`,
          transactionId: txId,
          itemType: it.itemType,
          serviceId: it.serviceId || null,
          productId: it.productId || null,
          name: it.name,
          price: it.price,
          costPrice: it.costPrice || 0,
          quantity: it.quantity,
          subtotal: it.subtotal,
        };
        memoryDB.transactionItems.push(itemObj);

        // Potong stok produk
        if (it.itemType === "PRODUCT" && it.productId) {
          const prod = memoryDB.products.find((p) => p.id === it.productId);
          if (prod) {
            const prev = prod.stock;
            prod.stock = Math.max(0, prod.stock - it.quantity);
            memoryDB.stockMovements.push({
              id: `stk_${Date.now()}_${idx}`,
              productId: prod.id,
              type: "OUT",
              quantity: it.quantity,
              previousStock: prev,
              currentStock: prod.stock,
              reason: `Penjualan Kasir (${invoiceNumber})`,
              notes: `Customer: ${payload.customerName}`,
              createdAt: new Date(),
            });
          }
        }
        return itemObj;
      });

      const paymentObj = {
        id: `pay_${Date.now()}`,
        transactionId: txId,
        paymentMethod: payload.paymentMethod,
        amountPaid: payload.amountPaid,
        changeAmount: payload.changeAmount,
        paymentRef: payload.paymentRef || null,
        createdAt: new Date(),
      };
      memoryDB.payments.push(paymentObj);

      if (payload.paymentMethod === "CASH") {
        memoryDB.cashTransactions.push({
          id: `csh_${Date.now()}`,
          type: "CASH_IN",
          category: "Penjualan Kasir",
          amount: payload.grandTotal,
          description: `Pembayaran Cash Invoice ${invoiceNumber} (${payload.customerName})`,
          source: "POS_SALE",
          transactionId: txId,
          createdAt: new Date(),
        });
      }

      return {
        ...newTx,
        items: itemsCreated,
        payments: [paymentObj],
        barberman: memoryDB.barbermen.find((b) => b.id === payload.barbermanId) || null,
      };
    },
    true
  );
}

// -------------------------------------------------------------
// CASH MANAGEMENT
// Rumus: Cash Awal + Cash Masuk - Cash Keluar = Cash Saat Ini
// -------------------------------------------------------------

export async function getCashLedger() {
  return safeDb(
    async () => {
      const list = await prisma.cashTransaction.findMany({
        orderBy: { createdAt: "desc" },
        include: { transaction: true },
      });
      const settings = await prisma.shopSetting.findUnique({ where: { id: "default" } });
      const initialFloat = settings?.initialCashFloat ?? 100000;

      let totalCashIn = 0;
      let totalCashOut = 0;

      for (const item of list) {
        const isInitFloat =
          item.category === "Modal Awal" ||
          item.id === "csh_init" ||
          item.description?.toLowerCase().includes("modal awal");

        if (item.type === "CASH_IN") {
          if (!isInitFloat) {
            totalCashIn += item.amount;
          }
        } else if (item.type === "CASH_OUT") {
          totalCashOut += item.amount;
        }
      }

      const systemCash = initialFloat + totalCashIn - totalCashOut;

      return {
        initialFloat,
        totalCashIn,
        totalCashOut,
        systemCash,
        transactions: list,
      };
    },
    () => {
      const list = [...memoryDB.cashTransactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const initialFloat = memoryDB.shopSettings?.initialCashFloat ?? 100000;

      let totalCashIn = 0;
      let totalCashOut = 0;

      for (const item of list) {
        const isInitFloat =
          item.category === "Modal Awal" ||
          item.id === "csh_init" ||
          item.description?.toLowerCase().includes("modal awal");

        if (item.type === "CASH_IN") {
          if (!isInitFloat) {
            totalCashIn += item.amount;
          }
        } else if (item.type === "CASH_OUT") {
          totalCashOut += item.amount;
        }
      }

      const systemCash = initialFloat + totalCashIn - totalCashOut;

      return {
        initialFloat,
        totalCashIn,
        totalCashOut,
        systemCash,
        transactions: list,
      };
    }
  );
}

export async function createCashEntry(data: {
  type: "CASH_IN" | "CASH_OUT";
  category: string;
  amount: number;
  description: string;
  source?: string;
}) {
  return safeDb(
    async () => {
      return await prisma.cashTransaction.create({
        data: {
          type: data.type as any,
          category: data.category,
          amount: data.amount,
          description: data.description,
          source: data.source || "MANUAL",
        },
      });
    },
    () => {
      const entry = {
        id: `csh_${Date.now()}`,
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        source: data.source || "MANUAL",
        createdAt: new Date(),
      };
      memoryDB.cashTransactions.unshift(entry);
      return entry;
    },
    true
  );
}

// -------------------------------------------------------------
// DASHBOARD & PERFORMA BARBERMAN STATS
// -------------------------------------------------------------

export async function getDashboardData(filter: "today" | "yesterday" | "week" | "month" | "year" | "custom" = "today", customStart?: string, customEnd?: string) {
  const now = new Date();
  let startDate = startOfDay(now);
  let endDate = endOfDay(now);

  if (filter === "yesterday") {
    const yest = subDays(now, 1);
    startDate = startOfDay(yest);
    endDate = endOfDay(yest);
  } else if (filter === "week") {
    startDate = startOfDay(subDays(now, 7));
    endDate = endOfDay(now);
  } else if (filter === "month") {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  } else if (filter === "year") {
    startDate = startOfYear(now);
    endDate = endOfYear(now);
  } else if (filter === "custom" && customStart && customEnd) {
    startDate = startOfDay(new Date(customStart));
    endDate = endOfDay(new Date(customEnd));
  }

  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);

  return safeDb(
    async () => {
      // Metric queries
      const [
        barbermenList,
        filteredTxs,
        monthTxs,
        todayBookings,
        totalMembers,
        totalProducts,
        lowStockProducts,
        cashLedger,
      ] = await Promise.all([
        prisma.barberman.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        prisma.transaction.findMany({
          where: { createdAt: { gte: startDate, lte: endDate } },
          include: { items: true },
        }),
        prisma.transaction.findMany({
          where: { createdAt: { gte: startMonth, lte: endMonth } },
          include: { items: true },
        }),
        prisma.booking.count({
          where: { bookingDate: { gte: startOfDay(now), lte: endOfDay(now) } },
        }),
        prisma.member.count({ where: { status: "ACTIVE" } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
        getCashLedger(),
      ]);

      // Calculate totals
      const customerCount = filteredTxs.length;
      const transactionCount = filteredTxs.length;
      let revenue = 0;
      let productSalesRevenue = 0;

      for (const tx of filteredTxs) {
        revenue += tx.grandTotal;
        for (const item of tx.items) {
          if (item.itemType === "PRODUCT") {
            productSalesRevenue += item.subtotal;
          }
        }
      }

      let monthRevenue = 0;
      for (const tx of monthTxs) {
        monthRevenue += tx.grandTotal;
      }

      // Performa Barberman Table
      const barberPerformance = barbermenList.map((barber) => {
        const bTxs = filteredTxs.filter((t) => t.barbermanId === barber.id);
        const bCust = bTxs.length;
        const bOmzet = bTxs.reduce((acc, t) => acc + t.grandTotal, 0);
        return {
          id: barber.id,
          name: barber.name,
          customers: bCust,
          transactions: bCust,
          omzet: bOmzet,
        };
      });

      return {
        filter,
        metrics: {
          todayCustomer: customerCount,
          todayTransaction: transactionCount,
          todayRevenue: revenue,
          monthRevenue,
          todayBooking: todayBookings,
          totalMember: totalMembers,
          totalProduct: totalProducts,
          lowStockProducts,
          productSalesRevenue,
          cashInHand: cashLedger.systemCash,
        },
        barberPerformance,
      };
    },
    () => {
      // Memory Fallback
      const barbermenList = memoryDB.barbermen.filter((b) => b.isActive);
      const filteredTxs = memoryDB.transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= startDate && d <= endDate;
      });

      const monthTxs = memoryDB.transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= startMonth && d <= endMonth;
      });

      let revenue = 0;
      let productSalesRevenue = 0;

      for (const tx of filteredTxs) {
        revenue += tx.grandTotal;
        const items = memoryDB.transactionItems.filter((i) => i.transactionId === tx.id);
        for (const item of items) {
          if (item.itemType === "PRODUCT") {
            productSalesRevenue += item.subtotal;
          }
        }
      }

      let monthRevenue = 0;
      for (const tx of monthTxs) {
        monthRevenue += tx.grandTotal;
      }

      const todayBookings = memoryDB.bookings.filter((b) => {
        const d = new Date(b.bookingDate);
        return d >= startOfDay(now) && d <= endOfDay(now);
      }).length;

      const totalMembers = memoryDB.members.filter((m) => m.status === "ACTIVE").length;
      const totalProducts = memoryDB.products.filter((p) => p.isActive).length;
      const lowStockProducts = memoryDB.products.filter((p) => p.isActive && p.stock <= p.minStock).length;

      let cashIn = 0;
      let cashOut = 0;
      for (const c of memoryDB.cashTransactions) {
        if (c.type === "CASH_IN") cashIn += c.amount;
        else if (c.type === "CASH_OUT") cashOut += c.amount;
      }
      const cashInHand = cashIn - cashOut;

      const barberPerformance = barbermenList.map((barber) => {
        const bTxs = filteredTxs.filter((t) => t.barbermanId === barber.id);
        const bCust = bTxs.length;
        const bOmzet = bTxs.reduce((acc, t) => acc + t.grandTotal, 0);
        return {
          id: barber.id,
          name: barber.name,
          customers: bCust,
          transactions: bCust,
          omzet: bOmzet,
        };
      });

      return {
        filter,
        metrics: {
          todayCustomer: filteredTxs.length,
          todayTransaction: filteredTxs.length,
          todayRevenue: revenue,
          monthRevenue,
          todayBooking: todayBookings,
          totalMember: totalMembers,
          totalProduct: totalProducts,
          lowStockProducts,
          productSalesRevenue,
          cashInHand,
        },
        barberPerformance,
      };
    }
  );
}

// -------------------------------------------------------------
// LAPORAN KHUSUS (Pomade, Tonic & Powder, Harian, Bulanan, Tahunan)
// -------------------------------------------------------------

export async function getCategoryReport(categorySlug: string | string[], startDate?: Date, endDate?: Date) {
  const slugs = Array.isArray(categorySlug) ? categorySlug : [categorySlug];

  return safeDb(
    async () => {
      const categories = await prisma.productCategory.findMany({
        where: { slug: { in: slugs } },
        include: {
          products: {
            include: {
              transactionItems: {
                where: {
                  transaction: {
                    createdAt: {
                      gte: startDate,
                      lte: endDate,
                    },
                  },
                },
              },
            },
          },
        },
      });

      let totalSold = 0;
      let totalOmzet = 0;
      let totalModal = 0;
      let currentStock = 0;
      const productStats: any[] = [];

      for (const cat of categories) {
        for (const prod of cat.products) {
          currentStock += prod.stock;
          let prodSold = 0;
          let prodOmzet = 0;
          let prodModal = 0;

          for (const item of prod.transactionItems) {
            prodSold += item.quantity;
            prodOmzet += item.subtotal;
            prodModal += (item.costPrice || prod.costPrice) * item.quantity;
          }

          totalSold += prodSold;
          totalOmzet += prodOmzet;
          totalModal += prodModal;

          productStats.push({
            id: prod.id,
            sku: prod.sku,
            name: prod.name,
            categoryName: cat.name,
            sellingPrice: prod.sellingPrice,
            costPrice: prod.costPrice,
            stock: prod.stock,
            sold: prodSold,
            omzet: prodOmzet,
            modal: prodModal,
            profit: prodOmzet - prodModal,
          });
        }
      }

      productStats.sort((a, b) => b.sold - a.sold);

      return {
        categorySlugs: slugs,
        totalSold,
        totalOmzet,
        totalModal,
        totalProfit: totalOmzet - totalModal,
        currentStock,
        topProducts: productStats,
      };
    },
    () => {
      const catIds = memoryDB.categories.filter((c) => slugs.includes(c.slug)).map((c) => c.id);
      const prods = memoryDB.products.filter((p) => catIds.includes(p.categoryId));

      let totalSold = 0;
      let totalOmzet = 0;
      let totalModal = 0;
      let currentStock = 0;
      const productStats: any[] = [];

      for (const prod of prods) {
        currentStock += prod.stock;
        const cat = memoryDB.categories.find((c) => c.id === prod.categoryId);
        const items = memoryDB.transactionItems.filter((i) => i.productId === prod.id);

        let prodSold = 0;
        let prodOmzet = 0;
        let prodModal = 0;

        for (const it of items) {
          prodSold += it.quantity;
          prodOmzet += it.subtotal;
          prodModal += (it.costPrice || prod.costPrice) * it.quantity;
        }

        totalSold += prodSold;
        totalOmzet += prodOmzet;
        totalModal += prodModal;

        productStats.push({
          id: prod.id,
          sku: prod.sku,
          name: prod.name,
          categoryName: cat?.name || "Produk",
          sellingPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
          stock: prod.stock,
          sold: prodSold,
          omzet: prodOmzet,
          modal: prodModal,
          profit: prodOmzet - prodModal,
        });
      }

      productStats.sort((a, b) => b.sold - a.sold);

      return {
        categorySlugs: slugs,
        totalSold,
        totalOmzet,
        totalModal,
        totalProfit: totalOmzet - totalModal,
        currentStock,
        topProducts: productStats,
      };
    }
  );
}

export async function getDailyReport(dateStr?: string) {
  let targetDate = new Date();
  if (dateStr) {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      targetDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    } else {
      targetDate = new Date(dateStr);
    }
  }
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  const [pomadeReport, tonicPowderReport] = await Promise.all([
    getCategoryReport("pomade", start, end),
    getCategoryReport(["tonic", "powder"], start, end),
  ]);

  return safeDb(
    async () => {
      const [txs, barbermenList, cashEntries, bookingsList, newMembers] = await Promise.all([
        prisma.transaction.findMany({
          where: { createdAt: { gte: start, lte: end } },
          include: { items: true, barberman: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.barberman.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        prisma.cashTransaction.findMany({
          where: { createdAt: { gte: start, lte: end } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.booking.findMany({
          where: { bookingDate: { gte: start, lte: end } },
          include: { barberman: true, service: true },
        }),
        prisma.member.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
      ]);

      let serviceSales = 0;
      let productSales = 0;
      let totalOmzet = 0;

      for (const tx of txs) {
        totalOmzet += tx.grandTotal;
        for (const item of tx.items) {
          if (item.itemType === "SERVICE") serviceSales += item.subtotal;
          else if (item.itemType === "PRODUCT") productSales += item.subtotal;
        }
      }

      let cashIn = 0;
      let cashOut = 0;
      for (const c of cashEntries) {
        if (c.type === "CASH_IN") cashIn += c.amount;
        else if (c.type === "CASH_OUT") cashOut += c.amount;
      }

      const barbermanStats = barbermenList.map((b) => {
        const bTxs = txs.filter((t) => t.barbermanId === b.id);
        return {
          id: b.id,
          name: b.name,
          customerCount: bTxs.length,
          transactionCount: bTxs.length,
          omzet: bTxs.reduce((sum, t) => sum + t.grandTotal, 0),
        };
      });

      return {
        date: format(targetDate, "yyyy-MM-dd"),
        totalCustomers: txs.length,
        totalTransactions: txs.length,
        totalOmzet,
        serviceSales,
        productSales,
        pomadeSold: pomadeReport.totalSold,
        pomadeOmzet: pomadeReport.totalOmzet,
        tonicPowderSold: tonicPowderReport.totalSold,
        tonicPowderOmzet: tonicPowderReport.totalOmzet,
        cashIn,
        cashOut,
        cashEnding: cashIn - cashOut,
        bookingsCount: bookingsList.length,
        newMembersCount: newMembers,
        barbermanPerformance: barbermanStats,
        transactions: txs,
      };
    },
    () => {
      const txs = memoryDB.transactions
        .filter((t) => {
          const d = new Date(t.createdAt);
          return d >= start && d <= end;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      let serviceSales = 0;
      let productSales = 0;
      let totalOmzet = 0;

      for (const tx of txs) {
        totalOmzet += tx.grandTotal;
        const items = memoryDB.transactionItems.filter((i) => i.transactionId === tx.id);
        for (const item of items) {
          if (item.itemType === "SERVICE") serviceSales += item.subtotal;
          else if (item.itemType === "PRODUCT") productSales += item.subtotal;
        }
      }

      const cashEntries = memoryDB.cashTransactions.filter((c) => {
        const d = new Date(c.createdAt);
        return d >= start && d <= end;
      });

      let cashIn = 0;
      let cashOut = 0;
      for (const c of cashEntries) {
        if (c.type === "CASH_IN") cashIn += c.amount;
        else if (c.type === "CASH_OUT") cashOut += c.amount;
      }

      const barbermanStats = memoryDB.barbermen.filter((b) => b.isActive).map((b) => {
        const bTxs = txs.filter((t) => t.barbermanId === b.id);
        return {
          id: b.id,
          name: b.name,
          customerCount: bTxs.length,
          transactionCount: bTxs.length,
          omzet: bTxs.reduce((sum, t) => sum + t.grandTotal, 0),
        };
      });

      return {
        date: format(targetDate, "yyyy-MM-dd"),
        totalCustomers: txs.length,
        totalTransactions: txs.length,
        totalOmzet,
        serviceSales,
        productSales,
        pomadeSold: pomadeReport.totalSold,
        pomadeOmzet: pomadeReport.totalOmzet,
        tonicPowderSold: tonicPowderReport.totalSold,
        tonicPowderOmzet: tonicPowderReport.totalOmzet,
        cashIn,
        cashOut,
        cashEnding: cashIn - cashOut,
        bookingsCount: memoryDB.bookings.length,
        newMembersCount: 2,
        barbermanPerformance: barbermanStats,
        transactions: txs.map((t) => ({
          ...t,
          barberman: memoryDB.barbermen.find((b) => b.id === t.barbermanId),
          items: memoryDB.transactionItems.filter((i) => i.transactionId === t.id),
        })),
      };
    }
  );
}

export async function getAnnualReport(year: number = new Date().getFullYear()) {
  const monthsData = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  for (let m = 0; m < 12; m++) {
    const startM = new Date(year, m, 1);
    const endM = endOfMonth(startM);

    const mData = await safeDb(
      async () => {
        const txs = await prisma.transaction.findMany({
          where: { createdAt: { gte: startM, lte: endM } },
          include: { items: true },
        });

        let omzet = 0;
        let productOmzet = 0;
        for (const t of txs) {
          omzet += t.grandTotal;
          for (const it of t.items) {
            if (it.itemType === "PRODUCT") productOmzet += it.subtotal;
          }
        }

        return {
          month: monthNames[m],
          monthNumber: m + 1,
          customer: txs.length,
          transactions: txs.length,
          omzet,
          productOmzet,
        };
      },
      () => {
        const txs = memoryDB.transactions.filter((t) => {
          const d = new Date(t.createdAt);
          return d.getFullYear() === year && d.getMonth() === m;
        });

        let omzet = 0;
        let productOmzet = 0;
        for (const t of txs) {
          omzet += t.grandTotal;
          const items = memoryDB.transactionItems.filter((i) => i.transactionId === t.id);
          for (const it of items) {
            if (it.itemType === "PRODUCT") productOmzet += it.subtotal;
          }
        }

        return {
          month: monthNames[m],
          monthNumber: m + 1,
          customer: txs.length,
          transactions: txs.length,
          omzet,
          productOmzet,
        };
      }
    );

    monthsData.push(mData);
  }

  const totalOmzet = monthsData.reduce((s, m) => s + m.omzet, 0);
  const totalCustomer = monthsData.reduce((s, m) => s + m.customer, 0);
  const totalTransactions = monthsData.reduce((s, m) => s + m.transactions, 0);
  const totalProductSales = monthsData.reduce((s, m) => s + m.productOmzet, 0);

  return {
    year,
    months: monthsData,
    summary: {
      totalOmzet,
      totalCustomer,
      totalTransactions,
      totalProductSales,
    },
  };
}

export async function getMonthlyReport(yearNum?: number, monthNum?: number) {
  const now = new Date();
  const year = yearNum ?? now.getFullYear();
  const month = monthNum ?? now.getMonth(); // 0-indexed

  const startM = new Date(year, month, 1, 0, 0, 0);
  const endM = endOfMonth(startM);

  return safeDb(
    async () => {
      const [txs, barbermenList, cashEntries, servicesList, productsList] = await Promise.all([
        prisma.transaction.findMany({
          where: { createdAt: { gte: startM, lte: endM } },
          include: { items: true, barberman: true, payments: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.barberman.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        prisma.cashTransaction.findMany({
          where: { createdAt: { gte: startM, lte: endM } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.service.findMany({ where: { isActive: true } }),
        prisma.product.findMany({ include: { category: true } }),
      ]);

      let totalOmzet = 0;
      let serviceSales = 0;
      let productSales = 0;
      let productCost = 0;

      const paymentMap: Record<string, { count: number; total: number }> = {
        CASH: { count: 0, total: 0 },
        QRIS: { count: 0, total: 0 },
        TRANSFER: { count: 0, total: 0 },
        DEBIT: { count: 0, total: 0 },
      };

      const serviceMap: Record<string, { name: string; category: string; count: number; omzet: number }> = {};
      const productMap: Record<string, { name: string; sku: string; category: string; count: number; omzet: number; modal: number; stock: number }> = {};

      for (const tx of txs) {
        totalOmzet += tx.grandTotal;

        const pm = (tx.paymentMethod || "CASH").toUpperCase();
        if (!paymentMap[pm]) paymentMap[pm] = { count: 0, total: 0 };
        paymentMap[pm].count += 1;
        paymentMap[pm].total += tx.grandTotal;

        for (const it of tx.items) {
          if (it.itemType === "SERVICE") {
            serviceSales += it.subtotal;
            if (!serviceMap[it.name]) {
              serviceMap[it.name] = { name: it.name, category: "Haircut & Grooming", count: 0, omzet: 0 };
            }
            serviceMap[it.name].count += it.quantity;
            serviceMap[it.name].omzet += it.subtotal;
          } else if (it.itemType === "PRODUCT") {
            productSales += it.subtotal;
            const itemCost = (it.costPrice || 0) * it.quantity;
            productCost += itemCost;

            if (!productMap[it.name]) {
              const pObj = productsList.find((p) => p.name === it.name || p.id === it.productId);
              productMap[it.name] = {
                name: it.name,
                sku: pObj?.sku || "-",
                category: pObj?.category?.name || "Retail",
                count: 0,
                omzet: 0,
                modal: 0,
                stock: pObj?.stock || 0,
              };
            }
            productMap[it.name].count += it.quantity;
            productMap[it.name].omzet += it.subtotal;
            productMap[it.name].modal += itemCost;
          }
        }
      }

      let cashIn = 0;
      let cashOut = 0;
      const expensesList: any[] = [];

      for (const c of cashEntries) {
        if (c.type === "CASH_IN") {
          cashIn += c.amount;
        } else if (c.type === "CASH_OUT") {
          cashOut += c.amount;
          expensesList.push({
            id: c.id,
            category: c.category || "Operasional",
            description: c.description,
            amount: c.amount,
            date: format(new Date(c.createdAt), "yyyy-MM-dd HH:mm"),
          });
        }
      }

      const grossProfit = serviceSales + (productSales - productCost);
      const netOperatingIncome = grossProfit - cashOut;

      const barbermanStats = barbermenList.map((b) => {
        const bTxs = txs.filter((t) => t.barbermanId === b.id);
        const bOmzet = bTxs.reduce((sum, t) => sum + t.grandTotal, 0);
        const bCust = bTxs.length;
        const bTrans = bTxs.length;
        return {
          id: b.id,
          name: b.name,
          customerCount: bCust,
          transactionCount: bTrans,
          omzet: bOmzet,
          averagePerCustomer: bCust > 0 ? Math.round(bOmzet / bCust) : 0,
          contributionPercentage: totalOmzet > 0 ? Number(((bOmzet / totalOmzet) * 100).toFixed(1)) : 0,
        };
      });

      const paymentsBreakdown = Object.entries(paymentMap).map(([method, val]) => ({
        method,
        transactionCount: val.count,
        totalAmount: val.total,
        percentage: totalOmzet > 0 ? Number(((val.total / totalOmzet) * 100).toFixed(1)) : 0,
      }));

      const topServices = Object.values(serviceMap).sort((a, b) => b.omzet - a.omzet);
      const topProducts = Object.values(productMap).map((p) => ({
        ...p,
        profit: p.omzet - p.modal,
      })).sort((a, b) => b.omzet - a.omzet);

      return {
        year,
        month: month + 1,
        monthName: format(startM, "MMMM yyyy"),
        totalCustomers: txs.length,
        totalTransactions: txs.length,
        totalOmzet,
        serviceSales,
        productSales,
        productCost,
        grossProfit,
        cashExpenses: cashOut,
        netOperatingIncome,
        cashIn,
        cashOut,
        cashEnding: cashIn - cashOut,
        averageTicketSize: txs.length > 0 ? Math.round(totalOmzet / txs.length) : 0,
        barbermanPerformance: barbermanStats,
        paymentsBreakdown,
        topServices,
        topProducts,
        expensesList,
      };
    },
    () => {
      // Memory DB fallback
      const txs = memoryDB.transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      let totalOmzet = 0;
      let serviceSales = 0;
      let productSales = 0;
      let productCost = 0;

      const paymentMap: Record<string, { count: number; total: number }> = {
        CASH: { count: 0, total: 0 },
        QRIS: { count: 0, total: 0 },
        TRANSFER: { count: 0, total: 0 },
        DEBIT: { count: 0, total: 0 },
      };

      const serviceMap: Record<string, { name: string; category: string; count: number; omzet: number }> = {};
      const productMap: Record<string, { name: string; sku: string; category: string; count: number; omzet: number; modal: number; stock: number }> = {};

      for (const tx of txs) {
        totalOmzet += tx.grandTotal;

        const pm = (tx.paymentMethod || "CASH").toUpperCase();
        if (!paymentMap[pm]) paymentMap[pm] = { count: 0, total: 0 };
        paymentMap[pm].count += 1;
        paymentMap[pm].total += tx.grandTotal;

        const items = memoryDB.transactionItems.filter((i) => i.transactionId === tx.id);
        for (const it of items) {
          if (it.itemType === "SERVICE") {
            serviceSales += it.subtotal;
            if (!serviceMap[it.name]) {
              serviceMap[it.name] = { name: it.name, category: "Haircut & Grooming", count: 0, omzet: 0 };
            }
            serviceMap[it.name].count += it.quantity;
            serviceMap[it.name].omzet += it.subtotal;
          } else if (it.itemType === "PRODUCT") {
            productSales += it.subtotal;
            const itemCost = (it.costPrice || 0) * it.quantity;
            productCost += itemCost;

            if (!productMap[it.name]) {
              const pObj = memoryDB.products.find((p) => p.name === it.name || p.id === it.productId);
              productMap[it.name] = {
                name: it.name,
                sku: pObj?.sku || "-",
                category: "Retail Grooming",
                count: 0,
                omzet: 0,
                modal: 0,
                stock: pObj?.stock || 0,
              };
            }
            productMap[it.name].count += it.quantity;
            productMap[it.name].omzet += it.subtotal;
            productMap[it.name].modal += itemCost;
          }
        }
      }

      const cashEntries = memoryDB.cashTransactions.filter((c) => {
        const d = new Date(c.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      let cashIn = 0;
      let cashOut = 0;
      const expensesList: any[] = [];

      for (const c of cashEntries) {
        if (c.type === "CASH_IN") {
          cashIn += c.amount;
        } else if (c.type === "CASH_OUT") {
          cashOut += c.amount;
          expensesList.push({
            id: c.id,
            category: c.category || "Operasional",
            description: c.description,
            amount: c.amount,
            date: format(new Date(c.createdAt), "yyyy-MM-dd HH:mm"),
          });
        }
      }

      const grossProfit = serviceSales + (productSales - productCost);
      const netOperatingIncome = grossProfit - cashOut;

      const barbermanStats = memoryDB.barbermen.filter((b) => b.isActive).map((b) => {
        const bTxs = txs.filter((t) => t.barbermanId === b.id);
        const bOmzet = bTxs.reduce((sum, t) => sum + t.grandTotal, 0);
        const bCust = bTxs.length;
        const bTrans = bTxs.length;
        return {
          id: b.id,
          name: b.name,
          customerCount: bCust,
          transactionCount: bTrans,
          omzet: bOmzet,
          averagePerCustomer: bCust > 0 ? Math.round(bOmzet / bCust) : 0,
          contributionPercentage: totalOmzet > 0 ? Number(((bOmzet / totalOmzet) * 100).toFixed(1)) : 0,
        };
      });

      const paymentsBreakdown = Object.entries(paymentMap).map(([method, val]) => ({
        method,
        transactionCount: val.count,
        totalAmount: val.total,
        percentage: totalOmzet > 0 ? Number(((val.total / totalOmzet) * 100).toFixed(1)) : 0,
      }));

      const topServices = Object.values(serviceMap).sort((a, b) => b.omzet - a.omzet);
      const topProducts = Object.values(productMap).map((p) => ({
        ...p,
        profit: p.omzet - p.modal,
      })).sort((a, b) => b.omzet - a.omzet);

      return {
        year,
        month: month + 1,
        monthName: format(startM, "MMMM yyyy"),
        totalCustomers: txs.length,
        totalTransactions: txs.length,
        totalOmzet,
        serviceSales,
        productSales,
        productCost,
        grossProfit,
        cashExpenses: cashOut,
        netOperatingIncome,
        cashIn,
        cashOut,
        cashEnding: cashIn - cashOut,
        averageTicketSize: txs.length > 0 ? Math.round(totalOmzet / txs.length) : 0,
        barbermanPerformance: barbermanStats,
        paymentsBreakdown,
        topServices,
        topProducts,
        expensesList,
      };
    }
  );
}
