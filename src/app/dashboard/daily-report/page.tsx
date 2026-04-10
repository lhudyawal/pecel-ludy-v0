"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Send, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/helpers";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface LaporanHarian {
  id: string;
  sales_id: string;
  tanggal: string;
  status_hadir: string;
  supervisor_notes: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

interface TransactionSummary {
  total_sales: number;
  transaction_count: number;
  shops_visited: number;
}

export default function DailyReportPage() {
  const { user: clerkUser } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [user, setUser] = useState<Profile | null>(null);
  const [reports, setReports] = useState<LaporanHarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (clerkUser) {
      fetchUserProfile();
    }
  }, [clerkUser]);

  useEffect(() => {
    if (user) {
      fetchReports();
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

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("laporan_harian")
        .select("*")
        .eq("sales_id", user!.id)
        .order("tanggal", { ascending: false })
        .limit(30);

      if (error) throw error;
      setReports(data || []);

      // Fetch transaction summary for today
      const today = new Date().toISOString().split("T")[0];
      const { data: todayTransactions, error: transError } = await supabase
        .from("transaksi")
        .select("total_harga")
        .eq("sales_id", user!.id)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      if (transError) {
        console.error("Error fetching transaction summary:", transError);
      }

      if (todayTransactions && todayTransactions.length > 0) {
        const totalSales = todayTransactions.reduce((sum, t) => sum + (t.total_harga || 0), 0);
        
        // Count unique shops visited today
        const { data: shopsData } = await supabase
          .from("kunjungan")
          .select("toko_id")
          .eq("sales_id", user!.id)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`);

        const uniqueShops = new Set(shopsData?.map(s => s.toko_id) || []);

        setTransactionSummary({
          total_sales: totalSales,
          transaction_count: todayTransactions.length,
          shops_visited: uniqueShops.size
        });
      } else {
        setTransactionSummary(null);
      }
    } catch (error: any) {
      toast.error("Gagal memuat laporan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Check if report already exists
      const existing = reports.find((r) => r.tanggal === today);
      if (existing) {
        toast.error("Laporan hari ini sudah dikirim");
        return;
      }

      const { error } = await supabase.from("laporan_harian").insert({
        sales_id: user!.id,
        tanggal: today,
        status_hadir: "hadir",
        supervisor_notes: notes,
      });

      if (error) throw error;

      toast.success("Laporan harian berhasil dikirim!");
      setNotes("");
      fetchReports();
    } catch (error: any) {
      toast.error("Gagal mengirim laporan: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (report: LaporanHarian) => {
    const isVerified = report.verified_by !== null;
    const status = report.status_hadir;

    if (isVerified) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          {status === "hadir" ? "Terverifikasi - Hadir" : "Terverifikasi - Alpa"}
        </Badge>
      );
    }

    switch (status) {
      case "hadir":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu Verifikasi
          </Badge>
        );
      case "alpa":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Alpa
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const todayReport = reports.find((r) => {
    const today = new Date().toISOString().split("T")[0];
    return r.tanggal === today;
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Harian</h1>
          <p className="text-gray-600 mt-1">Kirim laporan kehadiran harian</p>
        </div>

        {/* Submit Report Card */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Kirim Laporan Harian
            </CardTitle>
            <CardDescription>
              Laporkan kehadiran dan rekap transaksi hari ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayReport ? (
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  {getStatusBadge(todayReport)}
                  <span className="text-sm text-gray-600">
                    Laporan tanggal {formatDate(todayReport.tanggal)}
                  </span>
                </div>
                
                {/* Transaction Summary for this report */}
                {transactionSummary && (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded-lg mb-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-700">{transactionSummary.transaction_count}</p>
                      <p className="text-xs text-gray-600">Transaksi</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(transactionSummary.total_sales)}</p>
                      <p className="text-xs text-gray-600">Total Penjualan</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-700">{transactionSummary.shops_visited}</p>
                      <p className="text-xs text-gray-600">Toko Dikunjungi</p>
                    </div>
                  </div>
                )}

                {todayReport.supervisor_notes && (
                  <div className="p-3 bg-amber-50 rounded border border-amber-200">
                    <p className="text-sm font-medium text-amber-900">Catatan Supervisor:</p>
                    <p className="text-sm text-amber-800 mt-1">{todayReport.supervisor_notes}</p>
                    {todayReport.verified_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Diverifikasi pada: {formatDate(todayReport.verified_at, true)}
                      </p>
                    )}
                  </div>
                )}

                {!todayReport.verified_by && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        <strong>Status:</strong> Menunggu verifikasi supervisor
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Today's Transaction Summary */}
                {transactionSummary ? (
                  <div className="p-4 bg-white rounded-lg border">
                    <p className="text-sm font-medium text-gray-700 mb-3">Rekap Transaksi Hari Ini:</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xl font-bold text-blue-700">{transactionSummary.transaction_count}</p>
                        <p className="text-xs text-gray-600">Transaksi</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-700">{formatCurrency(transactionSummary.total_sales)}</p>
                        <p className="text-xs text-gray-600">Total Penjualan</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xl font-bold text-purple-700">{transactionSummary.shops_visited}</p>
                        <p className="text-xs text-gray-600">Toko Dikunjungi</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Belum ada transaksi hari ini</p>
                        <p className="text-xs text-amber-800 mt-1">
                          Pastikan Anda sudah input transaksi sebelum mengirim laporan
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan untuk Supervisor (opsional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Tambahkan catatan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSubmitReport}
                  disabled={submitting}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? "Mengirim..." : "Kirim Laporan Harian"}
                </Button>
                <div className="flex items-start gap-2 p-3 bg-amber-100 rounded">
                  <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    <strong>Penting:</strong> Laporan yang sudah dikirim akan menunggu verifikasi supervisor. 
                    Target bulanan akan diperhitungkan dari laporan yang sudah diverifikasi.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reports History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Laporan Harian</CardTitle>
            <CardDescription>
              {reports.filter(r => r.verified_by).length} laporan terverifikasi dari {reports.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Belum ada laporan</p>
                <p className="text-sm mt-1">Mulai kirim laporan harian Anda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => {
                  const isVerified = report.verified_by !== null;
                  return (
                    <div
                      key={report.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isVerified ? 'bg-green-50/50 border-green-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(report)}
                            <span className="font-medium">
                              {formatDate(report.tanggal)}
                            </span>
                          </div>
                          
                          {/* Show verification details if verified */}
                          {isVerified && (
                            <div className="mt-2 text-sm text-gray-600">
                              <p className="text-green-700 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Terverifikasi
                              </p>
                              {report.verified_at && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Tanggal verifikasi: {formatDate(report.verified_at, true)}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Show pending status */}
                          {!isVerified && report.status_hadir === "hadir" && (
                            <div className="mt-2 text-sm text-blue-700">
                              <p className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Menunggu verifikasi supervisor
                              </p>
                            </div>
                          )}

                          {report.supervisor_notes && (
                            <div className={`mt-2 p-2 rounded text-sm ${
                              isVerified ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'
                            }`}>
                              <p className="font-medium">Catatan Supervisor:</p>
                              <p className="mt-1">{report.supervisor_notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 text-right ml-3">
                          <p>Dibuat:</p>
                          <p>{formatDate(report.created_at, true)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
