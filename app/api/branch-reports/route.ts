import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { memoryDB, initMemoryDBIfNeeded, saveLocalDB } from "@/lib/db";

export const dynamic = "force-dynamic";

function ensureBranchReports() {
  if (!memoryDB.branchReports) {
    (memoryDB as any).branchReports = [];
  }
}

export async function GET(req: NextRequest) {
  try {
    await initMemoryDBIfNeeded();
    ensureBranchReports();

    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filterBranch = searchParams.get("branch") || undefined;

    let reports: any[] = (memoryDB as any).branchReports || [];

    // Admin hanya lihat laporan dari cabang mereka sendiri
    if (session.role === "ADMIN_TELKOM") {
      reports = reports.filter((r: any) => r.branch === "Telkom");
    } else if (session.role === "ADMIN_SUTA") {
      reports = reports.filter((r: any) => r.branch === "Suta");
    } else if (filterBranch && filterBranch !== "All") {
      // Owner bisa filter by branch
      reports = reports.filter((r: any) => r.branch === filterBranch);
    }

    // Sort by newest first
    reports = [...reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = reports.filter((r: any) => !r.isRead && session.role !== "ADMIN_TELKOM" && session.role !== "ADMIN_SUTA").length;

    return NextResponse.json({ reports, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initMemoryDBIfNeeded();
    ensureBranchReports();

    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN_TELKOM" && session.role !== "ADMIN_SUTA") {
      return NextResponse.json({ error: "Hanya admin cabang yang bisa mengirim laporan" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Judul dan isi laporan wajib diisi" }, { status: 400 });
    }

    const newReport = {
      id: `br_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: body.title.trim(),
      content: body.content.trim(),
      branch: session.branch || (session.role === "ADMIN_TELKOM" ? "Telkom" : "Suta"),
      fromAdmin: session.name || session.username,
      fromRole: session.role,
      period: body.period || new Date().toISOString().slice(0, 7), // YYYY-MM
      type: body.type || "Umum", // Harian, Mingguan, Bulanan, Keuangan, Stok
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    (memoryDB as any).branchReports.push(newReport);
    saveLocalDB();

    return NextResponse.json(newReport, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initMemoryDBIfNeeded();
    ensureBranchReports();

    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "OWNER" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Owner yang bisa menandai laporan" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID laporan wajib diisi" }, { status: 400 });

    const reports: any[] = (memoryDB as any).branchReports || [];
    const idx = reports.findIndex((r: any) => r.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });

    reports[idx] = { ...reports[idx], ...body, updatedAt: new Date().toISOString() };
    saveLocalDB();

    return NextResponse.json(reports[idx]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await initMemoryDBIfNeeded();
    ensureBranchReports();

    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const reports: any[] = (memoryDB as any).branchReports || [];
    const idx = reports.findIndex((r: any) => r.id === id);
    if (idx === -1) return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });

    // Admin hanya bisa hapus laporan cabangnya sendiri
    const report = reports[idx];
    if (session.role === "ADMIN_TELKOM" && report.branch !== "Telkom") {
      return NextResponse.json({ error: "Tidak ada akses" }, { status: 403 });
    }
    if (session.role === "ADMIN_SUTA" && report.branch !== "Suta") {
      return NextResponse.json({ error: "Tidak ada akses" }, { status: 403 });
    }

    reports.splice(idx, 1);
    saveLocalDB();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
