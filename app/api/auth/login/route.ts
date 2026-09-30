import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setAdminSessionCookie } from "@/lib/auth";
import { findAdminUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { usernameOrEmail, password } = await req.json();

    const cleanUser = String(usernameOrEmail || "").trim();
    const cleanPass = String(password || "").trim();

    if (!cleanUser || !cleanPass) {
      return NextResponse.json({ error: "Username/Email dan Password wajib diisi" }, { status: 400 });
    }

    const user = await findAdminUser(cleanUser);

    if (!user) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    // Hanya izinkan username yang terdaftar resmi
    const allowedUsernames = ["owner", "admin_telkom", "admin_suta"];
    if (!allowedUsernames.includes(user.username.toLowerCase())) {
      return NextResponse.json({ error: "Akun ini tidak memiliki akses ke sistem" }, { status: 403 });
    }

    // Verifikasi password dengan bcrypt — tidak ada bypass
    const isValid = await bcrypt.compare(cleanPass, user.passwordHash).catch(() => false);
    if (!isValid) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    const userAny = user as any;
    const role = userAny.role || (user.username === "admin_telkom" ? "ADMIN_TELKOM" : user.username === "admin_suta" ? "ADMIN_SUTA" : "OWNER");
    const branch = userAny.branch || (role === "ADMIN_TELKOM" ? "Telkom" : role === "ADMIN_SUTA" ? "Suta" : "All");

    const sessionPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role,
      branch,
    };

    await setAdminSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      user: sessionPayload,
      message: `Login berhasil sebagai ${role === "OWNER" ? "Owner" : role === "ADMIN_TELKOM" ? "Admin Telkom" : role === "ADMIN_SUTA" ? "Admin Suta" : "Admin"}`,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
