"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Award, AlertTriangle } from "lucide-react";
import { formatCurrency, calculateProgress } from "@/lib/helpers";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface SalesPerformance {
  id: string;
  full_name: string;
  monthly_target: number;
  total_sales: number;
  transaction_count: number;
  shops_visited: number;
  attendance_rate: number;
}

const COLORS = ["#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa"];

export default function PerformancePage() {
  const { user: clerkUser } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [user, setUser] = useState<Profile | null>(null);
  const [salesData, setSalesData] = useState<SalesPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState({
    totalSales: 0,
    avgProgress: 0,
    topPerformer: "",
    needsAttention: 0,
  });

  useEffect(() => {
    if (clerkUser) {
      fetchUserProfile();
    }
  }, [clerkUser]);

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("clerk_id", clerkUser!.id)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error: any) {
      toast.error("Gagal memuat profil: " + error.message);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get all sales under this supervisor
      const { data: salesUsers, error: salesError } = await supabase
        .from("profiles")
        .select("id, full_name, monthly_target")
        .eq("supervisor_id", user!.id)
        .eq("role", "sales");

      if (salesError) throw salesError;

      const performanceData: SalesPerformance[] = [];

      for (const sales of salesUsers || []) {
        // Get transactions
        const { data: transactions } = await supabase
          .from("transaksi")
          .select("total_harga")
          .eq("sales_id", sales.id)
          .gte("created_at", startOfMonth.toISOString());

        const totalSales = transactions?.reduce((sum, t) => sum + Number(t.total_harga), 0) || 0;
        const transactionCount = transactions?.length || 0;

        // Get shops visited
        const { data: visits } = await supabase
          .from("kunjungan")
          .select("id")
          .eq("sales_id", sales.id)
          .gte("created_at", startOfMonth.toISOString());

        // Get attendance
        const { data: attendance } = await supabase
          .from("laporan_harian")
          .select("id")
          .eq("sales_id", sales.id)
          .eq("status_hadir", "hadir")
          .gte("tanggal", startOfMonth.toISOString());

        const daysInMonth = new Date().getDate();
        const attendanceRate = daysInMonth > 0 ? ((attendance?.length || 0) / daysInMonth) * 100 : 0;

        performanceData.push({
          id: sales.id,
          full_name: sales.full_name,
          monthly_target: sales.monthly_target || 10000000,
          total_sales: totalSales,
          transaction_count: transactionCount,
          shops_visited: visits?.length || 0,
          attendance_rate: attendanceRate,
        });
      }

      setSalesData(performanceData);

      // Calculate team stats
      const totalSales = performanceData.reduce((sum, s) => sum + s.total_sales, 0);
      const avgProgress =
        performanceData.length > 0
          ? performanceData.reduce((sum, s) => sum + calculateProgress(s.monthly_target, s.total_sales), 0) / performanceData.length
          : 0;
      
      const topPerformer = performanceData.length > 0
        ? performanceData.reduce((prev, current) =>
            prev.total_sales > current.total_sales ? prev : current
          ).full_name
        : "-";

      const needsAttention = performanceData.filter(
        (s) => calculateProgress(s.monthly_target, s.total_sales) < 50
      ).length;

      setTeamStats({
        totalSales,
        avgProgress,
        topPerformer,
        needsAttention,
      });
    } catch (error: any) {
      toast.error("Gagal memuat data performa: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = salesData.map((s) => ({
    name: s.full_name.split(" ")[0],
    penjualan: s.total_sales,
    target: s.monthly_target,
    progress: calculateProgress(s.monthly_target, s.total_sales),
  }));

  const attendanceData = salesData.map((s) => ({
    name: s.full_name.split(" ")[0],
    kehadiran: s.attendance_rate,
  }));

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performa Tim</h1>
          <p className="text-gray-600 mt-1">Analisis pencapaian tim sales</p>
        </div>

        {/* Team Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Penjualan Tim</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(teamStats.totalSales)}</div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Progress</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.avgProgress.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Per sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{teamStats.topPerformer}</div>
              <p className="text-xs text-muted-foreground">Penjualan tertinggi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perlu Perhatian</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{teamStats.needsAttention}</div>
              <p className="text-xs text-muted-foreground">Di bawah 50% target</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Memuat data...</div>
        ) : salesData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Belum ada data sales dalam tim Anda
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Sales vs Target Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Penjualan vs Target</CardTitle>
                <CardDescription>Perbandingan pencapaian per sales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="penjualan" fill="#ea580c" name="Penjualan" />
                    <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Persentase Pencapaian Target</CardTitle>
                <CardDescription>Berapa persen target yang sudah dicapai</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      stroke="#ea580c"
                      strokeWidth={2}
                      dot={{ fill: "#ea580c" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Individual Performance Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {salesData.map((sales, index) => {
                const progress = calculateProgress(sales.monthly_target, sales.total_sales);
                return (
                  <Card key={sales.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{sales.full_name}</CardTitle>
                        <Badge
                          className={
                            progress >= 80
                              ? "bg-green-100 text-green-800"
                              : progress >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span className="font-bold">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Penjualan:</span>
                          <span className="font-medium">{formatCurrency(sales.total_sales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaksi:</span>
                          <span>{sales.transaction_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Toko Dikunjungi:</span>
                          <span>{sales.shops_visited}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kehadiran:</span>
                          <span>{sales.attendance_rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
