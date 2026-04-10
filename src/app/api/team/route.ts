import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/team - Get team members (for supervisor/admin)
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
        { error: "Only admin/supervisor can view teams" },
        { status: 403 }
      );
    }

    let query = supabase
      .from("profiles")
      .select("*, supervisor:profiles!supervisor_id(full_name)")
      .order("full_name");

    // Supervisor can only see their own team
    if (profile.role === "supervisor") {
      query = query.eq("supervisor_id", profile.id);
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

// POST /api/team - Create new team member (admin only)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const supabase = await createSupabaseServerClient();

    // Get user profile
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (!adminProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (adminProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin can create team members" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        clerk_id: `clerk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        full_name: body.full_name,
        email: body.email,
        role: body.role || "sales",
        supervisor_id: body.supervisor_id || null,
        base_salary: body.base_salary || 2200000,
        monthly_target: body.monthly_target || 10000000,
        phone: body.phone || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
