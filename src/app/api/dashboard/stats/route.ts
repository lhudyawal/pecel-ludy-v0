import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || String(new Date().getMonth() + 1);
    const year = searchParams.get("year") || String(new Date().getFullYear());

    const supabase = await createSupabaseServerClient();

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const startOfMonth = `${year}-${month.padStart(2, "0")}-01`;

    let stats: any = {
      profile,
      totalSales: 0,
      transactionCount: 0,
      shopsVisited: 0,
      attendanceDays: 0,
      pendingReports: 0,
      progress: 0,
      penalty: 0,
      estimatedSalary: profile.base_salary || 2200000,
    };

    if (profile.role === "sales") {
      // Get total sales this month
      const { data: transactions } = await supabase
        .from("transaksi")
        .select("total_harga")
        .eq("sales_id", profile.id)
        .gte("created_at", startOfMonth);

      stats.totalSales = transactions?.reduce((sum, t) => sum + Number(t.total_harga), 0) || 0;
      stats.transactionCount = transactions?.length || 0;

      // Get shops visited
      const { data: visits } = await supabase
        .from("kunjungan")
        .select("id")
        .eq("sales_id", profile.id)
        .gte("created_at", startOfMonth);

      stats.shopsVisited = visits?.length || 0;

      // Get attendance
      const { data: attendance } = await supabase
        .from("laporan_harian")
        .select("id")
        .eq("sales_id", profile.id)
        .eq("status_hadir", "hadir")
        .gte("tanggal", startOfMonth);

      stats.attendanceDays = attendance?.length || 0;

      // Get pending reports
      const { data: pendingReports } = await supabase
        .from("laporan_harian")
        .select("id")
        .eq("sales_id", profile.id)
        .eq("status_hadir", "pending");

      stats.pendingReports = pendingReports?.length || 0;

      // Calculate progress and penalty
      const monthlyTarget = profile.monthly_target || 10000000;
      const baseSalary = profile.base_salary || 2200000;

      stats.progress = monthlyTarget > 0 ? (stats.totalSales / monthlyTarget) * 100 : 0;
      stats.penalty = stats.totalSales < monthlyTarget 
        ? (monthlyTarget - stats.totalSales) * 0.1 
        : 0;
      stats.estimatedSalary = baseSalary - stats.penalty;
    } else if (profile.role === "supervisor") {
      // Get team stats for supervisor
      const { data: salesUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("supervisor_id", profile.id)
        .eq("role", "sales");

      const salesIds = salesUsers?.map((s) => s.id) || [];

      if (salesIds.length > 0) {
        // Total team sales
        const { data: teamSales } = await supabase
          .from("transaksi")
          .select("total_harga")
          .in("sales_id", salesIds)
          .gte("created_at", startOfMonth);

        stats.totalSales = teamSales?.reduce((sum, t) => sum + Number(t.total_harga), 0) || 0;
        stats.transactionCount = teamSales?.length || 0;

        // Pending reports
        const { data: pendingReports } = await supabase
          .from("laporan_harian")
          .select("id")
          .in("sales_id", salesIds)
          .eq("status_hadir", "pending");

        stats.pendingReports = pendingReports?.length || 0;
      }

      stats.teamSize = salesIds.length;
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
