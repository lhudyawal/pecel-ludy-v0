import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// PUT /api/team/[id] - Update team member (admin only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = await params;

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
        { error: "Only admin can update team members" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(body)
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

// DELETE /api/team/[id] - Delete team member (admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
        { error: "Only admin can delete team members" },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
