"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Printer, MapPin, Phone, Store, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

interface Profile {
  id: string;
  clerk_id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Toko {
  id: string;
  nama_toko: string;
  pemilik: string;
  jalan: string;
  no: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  phone: string;
}

interface RencanaKunjungan {
  id: string;
  toko_id: string;
  sales_id: string;
  tanggal_rencana: string;
  is_completed: boolean;
  toko: Toko;
}

export default function VisitsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<Profile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [shops, setShops] = useState<Toko[]>([]);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [visitPlans, setVisitPlans] = useState<RencanaKunjungan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clerkUser) {
      fetchUserProfile();
    }
  }, [clerkUser]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user?.id, selectedDate]);

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

  const fetchData = async () => {
    try {
      // Fetch all shops for this sales
      const { data: shopsData } = await supabase
        .from("toko")
        .select("*")
        .eq("sales_id", user!.id)
        .order("nama_toko");

      setShops(shopsData || []);

      // Fetch visit plans for selected date
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data: plansData, error: plansError } = await supabase
        .from("rencana_kunjungan")
        .select("*, toko(*)")
        .eq("sales_id", user!.id)
        .eq("tanggal_rencana", dateStr);

      if (plansError) throw plansError;
      setVisitPlans(plansData || []);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShopSelect = (shopId: string) => {
    setSelectedShops((prev) =>
      prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]
    );
  };

  const handleSelectAll = () => {
    if (selectedShops.length === shops.length) {
      setSelectedShops([]);
    } else {
      setSelectedShops(shops.map((s) => s.id));
    }
  };

  const handleSavePlan = async () => {
    if (selectedShops.length === 0) {
      toast.error("Pilih minimal 1 toko untuk dikunjungi");
      return;
    }

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const plans = selectedShops.map((shopId) => ({
        toko_id: shopId,
        sales_id: user!.id,
        tanggal_rencana: dateStr,
      }));

      const { error } = await supabase.from("rencana_kunjungan").insert(plans);

      if (error) throw error;

      toast.success(`Rencana kunjungan untuk ${selectedShops.length} toko berhasil disimpan`);
      setSelectedShops([]);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menyimpan rencana: " + error.message);
    }
  };

  const handlePrintPlan = () => {
    const dateStr = format(selectedDate, "dd MMMM yyyy", { locale: id });
    const shopsToPrint = visitPlans.map((p) => p.toko);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup diblokir. Izinkan popup untuk mencetak.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rencana Kunjungan - ${dateStr}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ea580c; padding-bottom: 15px; }
          .header h1 { color: #ea580c; margin: 0; }
          .header p { margin: 5px 0; color: #666; }
          .shop { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; page-break-inside: avoid; }
          .shop h3 { margin: 0 0 10px 0; color: #ea580c; }
          .shop-info { display: grid; grid-template-columns: 100px 1fr; gap: 5px; font-size: 14px; }
          .label { font-weight: bold; color: #666; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
          .checkbox { margin-left: 10px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌶️ SAMBEL PECEL LUDY</h1>
          <h2>Rencana Kunjungan</h2>
          <p><strong>${dateStr}</strong></p>
          <p>Sales: ${user!.full_name}</p>
        </div>
        ${shopsToPrint.map((shop, idx) => `
          <div class="shop">
            <h3>${idx + 1}. ${shop.nama_toko} <span class="checkbox">☐</span></h3>
            <div class="shop-info">
              <span class="label">Pemilik:</span>
              <span>${shop.pemilik}</span>
              <span class="label">Alamat:</span>
              <span>${shop.jalan}${shop.no ? " No. " + shop.no : ""}, RT ${shop.rt || "-"}/RW ${shop.rw || "-"}</span>
              <span></span>
              <span>${shop.desa ? shop.desa + ", " : ""}${shop.kecamatan ? shop.kecamatan + ", " : ""}${shop.kota}</span>
              <span></span>
              <span>${shop.provinsi}</span>
              ${shop.phone ? `<span class="label">Telepon:</span><span>${shop.phone}</span>` : ""}
            </div>
          </div>
        `).join("")}
        <div class="footer">
          <p>Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}</p>
          <p>SAMBEL PECEL LUDY - Sistem Penjualan</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleMarkComplete = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("rencana_kunjungan")
        .update({ is_completed: true })
        .eq("id", planId);

      if (error) throw error;

      toast.success("Kunjungan ditandai selesai");
      fetchData();
    } catch (error: any) {
      toast.error("Gagal memperbarui status: " + error.message);
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rencana Kunjungan</h1>
          <p className="text-gray-600 mt-1">Pilih toko dan cetak rencana kunjungan</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Pilih Tanggal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={id}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Shop Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Pilih Toko untuk Dikunjungi</CardTitle>
              <CardDescription>
                {format(selectedDate, "dd MMMM yyyy", { locale: id })} - {selectedShops.length} toko dipilih
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
              ) : shops.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada toko. Tambahkan toko terlebih dahulu.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="select-all"
                      checked={selectedShops.length === shops.length && shops.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                      Pilih Semua ({shops.length})
                    </label>
                  </div>
                  <Separator />
                  {shops.map((shop) => (
                    <div
                      key={shop.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleShopSelect(shop.id)}
                    >
                      <Checkbox
                        checked={selectedShops.includes(shop.id)}
                        onCheckedChange={() => handleShopSelect(shop.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">{shop.nama_toko}</span>
                        </div>
                        <div className="flex items-start gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>
                            {shop.kota}
                            {shop.phone && (
                              <span className="flex items-center gap-1 ml-2">
                                <Phone className="w-3 h-3" />
                                {shop.phone}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleSavePlan}
                  disabled={selectedShops.length === 0}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Simpan Rencana
                </Button>
                <Button
                  onClick={handlePrintPlan}
                  variant="outline"
                  disabled={visitPlans.length === 0}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visit Plans for Selected Date */}
        {visitPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Rencana Kunjungan - {format(selectedDate, "dd MMMM yyyy", { locale: id })}
              </CardTitle>
              <CardDescription>
                {visitPlans.length} toko dalam rencana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visitPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {plan.is_completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Store className="w-5 h-5 text-orange-600" />
                        )}
                        <span className="font-medium">{plan.toko.nama_toko}</span>
                        {plan.is_completed && (
                          <Badge variant="secondary" className="text-xs">
                            Selesai
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {plan.toko.jalan}
                        {plan.toko.no ? " No. " + plan.toko.no : ""}, {plan.toko.kota}
                      </p>
                    </div>
                    {!plan.is_completed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkComplete(plan.id)}
                      >
                        Tandai Selesai
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
