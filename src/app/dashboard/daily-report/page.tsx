"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Send, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "hadir":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hadir
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
              Kirim Laporan Hari Ini
            </CardTitle>
            <CardDescription>
              Tekan tombol di bawah untuk mengirim laporan kehadiran harian
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayReport ? (
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(todayReport.status_hadir)}
                  <span className="text-sm text-gray-600">
                    Laporan sudah dikirim pada {formatDate(todayReport.created_at, true)}
                  </span>
                </div>
                {todayReport.supervisor_notes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded">
                    <p className="text-sm font-medium text-blue-900">Catatan Supervisor:</p>
                    <p className="text-sm text-blue-800 mt-1">{todayReport.supervisor_notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Tambahkan catatan (opsional)..."
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
                    <strong>Penting:</strong> Jika Anda tidak mengirim laporan hari ini, status akan
                    otomatis menjadi "Alpa/Tidak Masuk".
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reports History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Laporan</CardTitle>
            <CardDescription>30 laporan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Belum ada laporan</div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status_hadir)}
                        <span className="font-medium">
                          {formatDate(report.tanggal)}
                        </span>
                      </div>
                      {report.supervisor_notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Catatan: {report.supervisor_notes}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(report.created_at, true)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
