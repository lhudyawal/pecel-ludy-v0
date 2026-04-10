import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/transactions - Get transactions for current user
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

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
      .from("transaksi")
      .select(`
        *,
        toko:toko(nama_toko, pemilik, kota),
        product:products(name, size, price)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by user role
    if (profile.role === "sales") {
      query = query.eq("sales_id", profile.id);
    }

    // Filter by month/year if provided
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString();
      query = query.gte("created_at", startDate).lte("created_at", endDate);
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

// POST /api/transactions - Create transaction(s)
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

    // Handle single or multiple transactions
    const transactions = Array.isArray(body) ? body : [body];

    const { data, error } = await supabase
      .from("transaksi")
      .insert(
        transactions.map((t: any) => ({
          ...t,
          sales_id: profile.id,
        }))
      )
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
