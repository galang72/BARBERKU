/**
 * Simple in-memory cache untuk mengurangi DB calls berulang di Vercel serverless.
 * Setiap entry punya TTL (Time-To-Live) dalam detik.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlSeconds: number = 30): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export function invalidateAll(): void {
  cache.clear();
}

/**
 * Wrapper: ambil dari cache jika ada, kalau tidak fetch lalu simpan ke cache.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 30
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  setCached(key, data, ttlSeconds);
  return data;
}

// TTL constants (dalam detik)
export const TTL = {
  DASHBOARD: 20,       // Dashboard stats — 20 detik
  PRODUCTS: 30,        // Produk & stok — 30 detik
  SERVICES: 60,        // Layanan (jarang berubah) — 60 detik
  BARBERMEN: 60,       // Barberman (jarang berubah) — 60 detik
  CUSTOMERS: 30,       // Pelanggan — 30 detik
  MEMBERS: 30,         // Member — 30 detik
  BOOKINGS: 15,        // Booking (sering berubah) — 15 detik
  TRANSACTIONS: 15,    // Transaksi (sering berubah) — 15 detik
  CASH: 15,            // Kas — 15 detik
  REPORTS: 60,         // Laporan — 60 detik
  SETTINGS: 120,       // Pengaturan (sangat jarang berubah) — 120 detik
};
