"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, FileText, Users, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/helpers";
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
  profile: {
    full_name: string;
    email: string;
  };
  transaksi?: {
    total_harga: number;
  }[];
}

export default function VerificationPage() {
  const { user: clerkUser } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [user, setUser] = useState<Profile | null>(null);
  const [reports, setReports] = useState<LaporanHarian[]>([]);
  const [allReports, setAllReports] = useState<LaporanHarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<LaporanHarian | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified">("all");
  const [summary, setSummary] = useState({
    pending: 0,
    verified: 0,
    totalToday: 0
  });

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
      // Fetch all reports
      const { data, error } = await supabase
        .from("laporan_harian")
        .select(`
          *,
          profile:profiles!sales_id(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const reportsWithProfiles = data || [];
      setAllReports(reportsWithProfiles);

      // Calculate summary
      const today = new Date().toISOString().split("T")[0];
      const pendingCount = reportsWithProfiles.filter(
        r => r.verified_by === null && r.status_hadir === "hadir"
      ).length;
      const verifiedCount = reportsWithProfiles.filter(
        r => r.verified_by !== null
      ).length;
      const todayCount = reportsWithProfiles.filter(
        r => r.tanggal === today
      ).length;

      setSummary({
        pending: pendingCount,
        verified: verifiedCount,
        totalToday: todayCount
      });

      // Fetch transaction summaries for each report
      const reportsWithTransactions = await Promise.all(
        reportsWithProfiles.map(async (report) => {
          const { data: transactions } = await supabase
            .from("transaksi")
            .select("total_harga")
            .eq("sales_id", report.sales_id)
            .gte("created_at", `${report.tanggal}T00:00:00`)
            .lte("created_at", `${report.tanggal}T23:59:59`);

          return {
            ...report,
            transaksi: transactions || []
          };
        })
      );

      setReports(reportsWithTransactions);
    } catch (error: any) {
      toast.error("Gagal memuat laporan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReports = () => {
    switch (filterStatus) {
      case "pending":
        return reports.filter(r => r.verified_by === null && r.status_hadir === "hadir");
      case "verified":
        return reports.filter(r => r.verified_by !== null);
      default:
        return reports;
    }
  };

  const handleVerify = async (reportId: string, approved: boolean) => {
    setVerifying(true);
    try {
      const { error } = await supabase
        .from("laporan_harian")
        .update({
          status_hadir: approved ? "hadir" : "alpa",
          supervisor_notes: verificationNotes,
          verified_by: user!.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      toast.success(
        approved ? "Laporan diverifikasi sebagai hadir" : "Laporan ditandai sebagai alpa"
      );
      setDialogOpen(false);
      setVerificationNotes("");
      fetchReports();
    } catch (error: any) {
      toast.error("Gagal memverifikasi laporan: " + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const pendingCount = reports.length;
  const todayCount = reports.filter(
    (r) => r.tanggal === new Date().toISOString().split("T")[0]
  ).length;

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verifikasi Laporan</h1>
          <p className="text-gray-600 mt-1">Periksa dan verifikasi laporan harian sales</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifikasi</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.pending}</div>
              <p className="text-xs text-muted-foreground">Perlu ditindaklanjuti</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sudah Diverifikasi</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.verified}</div>
              <p className="text-xs text-muted-foreground">Laporan terverifikasi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Laporan Hari Ini</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalToday}</div>
              <p className="text-xs text-muted-foreground">Dari sales tim Anda</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            className="flex-1"
          >
            Semua ({reports.length})
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            onClick={() => setFilterStatus("pending")}
            className="flex-1"
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending ({summary.pending})
          </Button>
          <Button
            variant={filterStatus === "verified" ? "default" : "outline"}
            onClick={() => setFilterStatus("verified")}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Diverifikasi ({summary.verified})
          </Button>
        </div>

        {/* Verification Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Daftar Laporan
            </CardTitle>
            <CardDescription>
              {getFilteredReports().length} laporan{filterStatus === "all" ? "" : filterStatus === "pending" ? " pending" : " terverifikasi"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : getFilteredReports().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-600" />
                <p>Tidak ada laporan{filterStatus === "pending" ? " pending" : ""}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredReports().map((report) => {
                  const isVerified = report.verified_by !== null;
                  const totalTransactions = report.transaksi?.length || 0;
                  const totalSales = report.transaksi?.reduce((sum, t) => sum + (t.total_harga || 0), 0) || 0;

                  return (
                    <div
                      key={report.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isVerified ? 'bg-green-50/50 border-green-200' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">{report.profile?.full_name}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                isVerified
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-orange-100 text-orange-800 border-orange-200'
                              }`}
                            >
                              {isVerified ? '✓ Diverifikasi' : '⏳ Pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Tanggal: {formatDate(report.tanggal)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Dibuat: {formatDate(report.created_at, true)}
                          </p>

                          {/* Transaction Summary */}
                          {totalTransactions > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-600">Transaksi</p>
                                  <p className="font-semibold text-blue-700">{totalTransactions}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Total Penjualan</p>
                                  <p className="font-semibold text-blue-700">
                                    {new Intl.NumberFormat('id-ID', {
                                      style: 'currency',
                                      currency: 'IDR',
                                      minimumFractionDigits: 0
                                    }).format(totalSales)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {report.supervisor_notes && (
                            <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                              <span className="font-medium">Catatan:</span> {report.supervisor_notes}
                            </p>
                          )}

                          {isVerified && report.verified_at && (
                            <p className="text-xs text-green-600 mt-2">
                              Diverifikasi: {formatDate(report.verified_at, true)}
                            </p>
                          )}
                        </div>

                        {!isVerified && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setDialogOpen(true);
                            }}
                            className="bg-orange-600 hover:bg-orange-700 ml-3"
                          >
                            Verifikasi
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verifikasi Laporan</DialogTitle>
            <DialogDescription>
              Periksa laporan dari {selectedReport?.profile?.full_name} tanggal{" "}
              {selectedReport && formatDate(selectedReport.tanggal)}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Detail Laporan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales:</span>
                    <span className="font-medium">{selectedReport.profile?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span>{formatDate(selectedReport.tanggal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dibuat:</span>
                    <span>{formatDate(selectedReport.created_at, true)}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Summary in Dialog */}
              {selectedReport.transaksi && selectedReport.transaksi.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-3 text-blue-900">Ringkasan Transaksi</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">{selectedReport.transaksi.length}</p>
                      <p className="text-xs text-gray-600 mt-1">Total Transaksi</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-lg font-bold text-green-700">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(selectedReport.transaksi.reduce((sum, t) => sum + (t.total_harga || 0), 0))}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Total Penjualan</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Supervisor (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Tambahkan catatan..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => selectedReport.id && handleVerify(selectedReport.id, true)}
                  disabled={verifying}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Setujui (Hadir)
                </Button>
                <Button
                  onClick={() => selectedReport.id && handleVerify(selectedReport.id, false)}
                  disabled={verifying}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tandai Alpa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
