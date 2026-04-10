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
}

export default function VerificationPage() {
  const { user: clerkUser } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [user, setUser] = useState<Profile | null>(null);
  const [reports, setReports] = useState<LaporanHarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<LaporanHarian | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

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
        .select(`
          *,
          profile:profiles!sales_id(full_name, email)
        `)
        .eq("status_hadir", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat laporan: " + error.message);
    } finally {
      setLoading(false);
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
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Perlu ditindaklanjuti</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Laporan Hari Ini</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCount}</div>
              <p className="text-xs text-muted-foreground">Dari sales tim Anda</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales Aktif</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Dalam tim Anda</p>
            </CardContent>
          </Card>
        </div>

        {/* Verification Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Antrian Verifikasi
            </CardTitle>
            <CardDescription>
              Laporan yang menunggu verifikasi Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-600" />
                <p>Tidak ada laporan yang perlu diverifikasi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">{report.profile?.full_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(report.tanggal)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Dibuat pada {formatDate(report.created_at, true)}
                      </p>
                      {report.supervisor_notes && (
                        <p className="text-xs text-gray-500 mt-1">
                          Catatan: {report.supervisor_notes}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setDialogOpen(true);
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Verifikasi
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
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
                <h4 className="font-medium mb-2">Detail Laporan</h4>
                <div className="space-y-1 text-sm">
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
