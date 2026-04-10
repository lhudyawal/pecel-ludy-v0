import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/products - Get all active products
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    const supabase = await createSupabaseServerClient();

    // If user is authenticated, get all products
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("clerk_id", userId)
        .single();

      if (profile && ["admin", "supervisor"].includes(profile.role)) {
        // Admin/Supervisor can see all products (including inactive)
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("name");

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
      }
    }

    // Public/other users can only see active products
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/products - Create product (Admin/Supervisor only)
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

    if (!["admin", "supervisor"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Only admin/supervisor can create products" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .insert(body)
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
