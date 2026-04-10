"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShoppingCart, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { formatCurrency, calculateProgress, calculatePenalty, calculateEstimatedSalary } from "@/lib/helpers";

export function SalesDashboard() {
  const { user: clerkUser } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    monthlyTarget: 10000000,
    baseSalary: 2200000,
    shopsVisited: 0,
    pendingReports: 0,
  });

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
      setStats({
        totalSales: 0,
        monthlyTarget: data.monthly_target || 10000000,
        baseSalary: data.base_salary || 2200000,
        shopsVisited: 0,
        pendingReports: 0,
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: transactions } = await supabase
      .from("transaksi")
      .select("total_harga")
      .eq("sales_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    const totalSales = transactions?.reduce((sum, t) => sum + Number(t.total_harga), 0) || 0;

    const { data: visits } = await supabase
      .from("kunjungan")
      .select("id")
      .eq("sales_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    const { data: reports } = await supabase
      .from("laporan_harian")
      .select("id")
      .eq("sales_id", user.id)
      .eq("status_hadir", "pending");

    setStats({
      totalSales,
      monthlyTarget: stats.monthlyTarget,
      baseSalary: stats.baseSalary,
      shopsVisited: visits?.length || 0,
      pendingReports: reports?.length || 0,
    });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const progress = calculateProgress(stats.monthlyTarget, stats.totalSales);
  const penalty = calculatePenalty(stats.monthlyTarget, stats.totalSales);
  const estimatedSalary = calculateEstimatedSalary(stats.baseSalary, stats.monthlyTarget, stats.totalSales);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Sales</h1>
        <p className="text-muted-foreground mt-1">Selamat datang, {user.full_name}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyTarget)}</div>
            <p className="text-xs text-muted-foreground">Per bulan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toko Dikunjungi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shopsVisited}</div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">Perlu tindakan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress Target</CardTitle>
            <CardDescription>Pencapaian vs Target bulanan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimasi Gaji</CardTitle>
            <CardDescription>Perhitungan gaji bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gaji Pokok</span>
                <span className="font-medium">{formatCurrency(stats.baseSalary)}</span>
              </div>
              {penalty > 0 && (
                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>Potongan (10%)</span>
                  <span className="font-medium">- {formatCurrency(penalty)}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600 dark:text-orange-400">{formatCurrency(estimatedSalary)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
