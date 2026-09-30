import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const originalUrl = process.env.DATABASE_URL || "";
  let finalUrl = originalUrl;

  // Supabase PgBouncer / Connection Pooler WAJIB menyertakan pgbouncer=true
  // agar Prisma menonaktifkan named prepared statements (mencegah error 42P05)
  if (
    finalUrl &&
    (finalUrl.includes("pooler.supabase.com") || finalUrl.includes(":6543")) &&
    !finalUrl.includes("pgbouncer=true")
  ) {
    const sep = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${sep}pgbouncer=true`;
  }

  const options: any = {
    log: ["error"],
  };

  if (finalUrl) {
    options.datasources = {
      db: {
        url: finalUrl,
      },
    };
  }

  return new PrismaClient(options);
}

export const prisma = global.prismaGlobal || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

export default prisma;
