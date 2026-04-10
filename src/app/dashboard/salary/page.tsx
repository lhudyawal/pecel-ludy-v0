"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import {
  formatCurrency,
  calculateProgress,
  calculatePenalty,
  calculateEstimatedSalary,
  getCurrentMonthYear,
  getDaysInMonth,
} from "@/lib/helpers";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  base_salary: number;
  monthly_target: number;
}

interface TransactionSummary {
  total: number;
  count: number;
  dailyAverage: number;
}

export default function SalaryPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<TransactionSummary>({
    total: 0,
    count: 0,
    dailyAverage: 0,
  });
  const [workingDays, setWorkingDays] = useState({ total: 0, attended: 0 });
  const [loading, setLoading] = useState(true);
  const { month, year } = getCurrentMonthYear();
  const daysInMonth = getDaysInMonth(month, year);

  useEffect(() => {
    if (clerkUser) {
      fetchUserProfile();
    }
  }, [clerkUser]);

  useEffect(() => {
    if (user) {
      fetchSalaryData();
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

  const fetchSalaryData = async () => {
    try {
      const startOfMonth = new Date(year, month - 1, 1).toISOString();

      // Get transactions this month
      const { data: transData, error: transError } = await supabase
        .from("transaksi")
        .select("total_harga")
        .eq("sales_id", user!.id)
        .gte("created_at", startOfMonth);

      if (transError) throw transError;

      const total = transData?.reduce((sum, t) => sum + Number(t.total_harga), 0) || 0;
      const count = transData?.length || 0;
      const currentDay = new Date().getDate();
      const dailyAverage = currentDay > 0 ? total / currentDay : 0;

      setTransactions({ total, count, dailyAverage });

      // Get attendance
      const { data: attendanceData } = await supabase
        .from("laporan_harian")
        .select("tanggal")
        .eq("sales_id", user!.id)
        .eq("status_hadir", "hadir")
        .gte("tanggal", `${year}-${String(month).padStart(2, "0")}-01`);

      setWorkingDays({
        total: daysInMonth,
        attended: attendanceData?.length || 0,
      });
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const baseSalary = user.base_salary || 2200000;
  const monthlyTarget = user.monthly_target || 10000000;

  const progress = calculateProgress(monthlyTarget, transactions.total);
  const penalty = calculatePenalty(monthlyTarget, transactions.total);
  const estimatedSalary = calculateEstimatedSalary(baseSalary, monthlyTarget, transactions.total);
  const projectedTotal = transactions.dailyAverage * daysInMonth;
  const projectedProgress = calculateProgress(monthlyTarget, projectedTotal);
  const projectedPenalty = calculatePenalty(monthlyTarget, projectedTotal);
  const projectedSalary = calculateEstimatedSalary(baseSalary, monthlyTarget, projectedTotal);

  const isOnTrack = projectedTotal >= monthlyTarget;
  const daysRemaining = daysInMonth - new Date().getDate();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gaji & Target</h1>
          <p className="text-gray-600 mt-1">
            Perhitungan gaji dan progress target bulan {month}/{year}
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realisasi</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(transactions.total)}</div>
              <p className="text-xs text-muted-foreground">{transactions.count} transaksi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyTarget)}</div>
              <p className="text-xs text-muted-foreground">Per bulan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata/Hari</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(transactions.dailyAverage)}</div>
              <p className="text-xs text-muted-foreground">
                {new Date().getDate()} hari kerja
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Target Bulanan</CardTitle>
            <CardDescription>
              {daysInMonth - new Date().getDate()} hari tersisa bulan ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progress Saat Ini</span>
                <span className="font-bold text-orange-600">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(transactions.total)}</span>
                <span>{formatCurrency(monthlyTarget)}</span>
              </div>
            </div>

            <Separator />

            {/* Projection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isOnTrack ? (
                  <ArrowUp className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {isOnTrack ? "On Track" : "Perlu Peningkatan"}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Proyeksi akhir bulan: <strong>{formatCurrency(projectedTotal)}</strong>
                {isOnTrack ? (
                  <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Target Tercapai
                  </Badge>
                ) : (
                  <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Kurang {formatCurrency(monthlyTarget - projectedTotal)}
                  </Badge>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Salary Calculation */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Perhitungan Gaji Bulan Ini</CardTitle>
              <CardDescription>Berdasarkan realisasi penjualan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gaji Pokok</span>
                <span className="font-semibold">{formatCurrency(baseSalary)}</span>
              </div>
              {penalty > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span className="flex items-center gap-1">
                    <ArrowDown className="w-4 h-4" />
                    Potongan (10% dari selisih)
                  </span>
                  <span className="font-semibold">- {formatCurrency(penalty)}</span>
                </div>
              )}
              {penalty === 0 && transactions.total >= monthlyTarget && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Target Tercapai - Tidak ada potongan!
                  </span>
                  <span className="font-semibold">+ Rp 0</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Total Gaji</span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(estimatedSalary)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proyeksi Akhir Bulan</CardTitle>
              <CardDescription>Jika performa tetap seperti sekarang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gaji Pokok</span>
                <span className="font-semibold">{formatCurrency(baseSalary)}</span>
              </div>
              {projectedPenalty > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span className="flex items-center gap-1">
                    <ArrowDown className="w-4 h-4" />
                    Est. Potongan
                  </span>
                  <span className="font-semibold">- {formatCurrency(projectedPenalty)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Est. Total Gaji</span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(projectedSalary)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                *Proyeksi berdasarkan rata-rata penjualan {new Date().getDate()} hari terakhir
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Warning Card */}
        {progress < 50 && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900">⚠️ Peringatan Penting!</h3>
                  <p className="text-sm text-amber-800 mt-2">
                    Penjualan Anda masih di bawah 50% dari target. Dengan performa saat ini,
                    diperkirakan akan ada potongan gaji sebesar{" "}
                    <strong>{formatCurrency(projectedPenalty)}</strong>.
                  </p>
                  <div className="mt-3 p-3 bg-white rounded border border-amber-300">
                    <p className="text-sm text-amber-900">
                      <strong>Saran:</strong> Anda perlu meningkatkan penjualan rata-rata menjadi{" "}
                      <strong>
                        {formatCurrency(
                          (monthlyTarget - transactions.total) / Math.max(daysRemaining, 1)
                        )}
                      /hari
                    </strong>{" "}
                    untuk mencapai target bulan ini.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Kehadiran</CardTitle>
            <CardDescription>Bulan {month}/{year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{workingDays.attended}</p>
                <p className="text-sm text-gray-600 mt-1">Hadir</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">
                  {workingDays.total - workingDays.attended}
                </p>
                <p className="text-sm text-gray-600 mt-1">Tidak Hadir</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {workingDays.total > 0
                    ? ((workingDays.attended / workingDays.total) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-600 mt-1">Persentase</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
