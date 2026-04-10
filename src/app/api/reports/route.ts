import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/reports - Get daily reports
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30");

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

    let query = supabase
      .from("laporan_harian")
      .select(`
        *,
        profile:profiles!sales_id(full_name, email)
      `)
      .order("tanggal", { ascending: false })
      .limit(limit);

    // Sales can only see their own reports
    if (profile.role === "sales") {
      query = query.eq("sales_id", profile.id);
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

// POST /api/reports - Create daily report
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (profile.role !== "sales") {
      return NextResponse.json(
        { error: "Only sales can create reports" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("laporan_harian")
      .insert({
        sales_id: profile.id,
        tanggal: body.tanggal || new Date().toISOString().split("T")[0],
        status_hadir: "hadir",
        supervisor_notes: body.supervisor_notes || "",
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate entry (already submitted today)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Laporan hari ini sudah dikirim" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/reports/[id] - Verify/update report (Supervisor only)
export async function PUT(req: Request) {
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
        { error: "Only supervisors can verify reports" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("laporan_harian")
      .update({
        status_hadir: body.status_hadir,
        supervisor_notes: body.supervisor_notes,
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
