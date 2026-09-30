// Script to auto-sync schema to database if DATABASE_URL is present
const { execSync } = require("child_process");

let dbUrl = process.env.DATABASE_URL || "";

if (
  dbUrl &&
  !dbUrl.includes("localhost:5432") &&
  !dbUrl.includes("placeholder") &&
  !dbUrl.includes("[YOUR-")
) {
  if (
    (dbUrl.includes("pooler.supabase.com") || dbUrl.includes(":6543")) &&
    !dbUrl.includes("pgbouncer=true")
  ) {
    const sep = dbUrl.includes("?") ? "&" : "?";
    dbUrl = `${dbUrl}${sep}pgbouncer=true`;
  }

  console.log("⚡ DATABASE_URL detected. Syncing schema to database with Prisma db push...");
  try {
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
      },
    });
    console.log("✅ Database schema synchronized successfully!");
  } catch (err) {
    console.warn("⚠️ Warning: Prisma db push encountered an issue, proceeding with build anyway:", err.message);
  }
} else {
  console.log("ℹ️ No remote DATABASE_URL configured or using local fallback, skipping auto db push.");
}
