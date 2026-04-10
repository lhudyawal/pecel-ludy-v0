"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard-layout";
import { BarChart3, TrendingUp, Users, Package } from "lucide-react";

export default function AnalyticsPage() {
  const { user: clerkUser } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clerkUser) {
      fetchProfile();
    }
  }, [clerkUser]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", clerkUser!.id)
      .single();

    if (data) {
      setUser(data);
      fetchAnalytics();
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [usersRes, productsRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/products"),
      ]);

      if (usersRes.ok && productsRes.ok) {
        const users = await usersRes.json();
        const products = await productsRes.json();

        setStats({
          totalUsers: users.length,
          totalProducts: products.length,
          totalSales: users.filter((u: any) => u.role === "sales").length,
          totalRevenue: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Overview sistem dan performa tim</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">Aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Tersedia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistem</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">Berjalan normal</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selamat Datang di Dashboard Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📊 Fitur Admin:</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>✅ <strong>Manajemen Tim</strong> - Tambah, edit, dan kelola pengguna</li>
                  <li>✅ <strong>Master Produk</strong> - Kelola katalog produk sambel pecel</li>
                  <li>✅ <strong>Analytics</strong> - Monitor performa sistem</li>
                  <li>✅ <strong>Konfigurasi</strong> - Atur gaji dan target sales</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">🎯 Quick Tips:</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Supervisor dapat mengelola tim sales di bawahnya</li>
                  <li>• Sales dapat mengelola toko dan transaksi</li>
                  <li>• Setiap transaksi terverifikasi oleh supervisor</li>
                  <li>• Gaji dihitung otomatis berdasarkan target</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
