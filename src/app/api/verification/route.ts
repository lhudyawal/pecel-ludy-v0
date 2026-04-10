import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/verification/pending - Get pending reports for verification
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!["admin", "supervisor"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Only admin/supervisor can access verification" },
        { status: 403 }
      );
    }

    let query = supabase
      .from("laporan_harian")
      .select(`
        *,
        profile:profiles!sales_id(full_name, email)
      `)
      .eq("status_hadir", "pending")
      .order("created_at", { ascending: false });

    // If supervisor, only show their team's reports
    if (profile.role === "supervisor") {
      const { data: salesUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("supervisor_id", profile.id)
        .eq("role", "sales");

      const salesIds = salesUsers?.map((s) => s.id) || [];
      
      if (salesIds.length > 0) {
        query = query.in("sales_id", salesIds);
      } else {
        // No sales in team, return empty
        return NextResponse.json([]);
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/verification/[id] - Verify a report
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    const body = await req.json();

    const supabase = await createSupabaseServerClient();

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!["admin", "supervisor"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Only admin/supervisor can verify reports" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("laporan_harian")
      .update({
        status_hadir: body.status_hadir, // 'hadir' or 'alpa'
        supervisor_notes: body.supervisor_notes || "",
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        profile:profiles!sales_id(full_name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
