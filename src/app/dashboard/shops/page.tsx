"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Store, Search, MapPin, Phone, FileText } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  clerk_id: string;
  full_name: string;
  email: string;
  role: string;
  supervisor_id: string | null;
  base_salary: number;
  monthly_target: number;
}

interface Toko {
  id: string;
  sales_id: string;
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
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function ShopsPage() {
  const { user: clerkUser } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [user, setUser] = useState<Profile | null>(null);
  const [shops, setShops] = useState<Toko[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nama_toko: "",
    pemilik: "",
    jalan: "",
    no: "",
    rt: "",
    rw: "",
    desa: "",
    kecamatan: "",
    kota: "",
    provinsi: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    if (clerkUser) {
      fetchUserProfile();
    }
  }, [clerkUser]);

  useEffect(() => {
    if (user) {
      fetchShops();
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

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from("toko")
        .select("*")
        .eq("sales_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat data toko: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("toko").insert({
        ...formData,
        sales_id: user!.id,
      });

      if (error) throw error;

      toast.success("Toko berhasil ditambahkan!");
      setDialogOpen(false);
      resetForm();
      fetchShops();
    } catch (error: any) {
      toast.error("Gagal menambahkan toko: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nama_toko: "",
      pemilik: "",
      jalan: "",
      no: "",
      rt: "",
      rw: "",
      desa: "",
      kecamatan: "",
      kota: "",
      provinsi: "",
      phone: "",
      notes: "",
    });
  };

  const filteredShops = shops.filter((shop) =>
    shop.nama_toko.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.pemilik.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.kota.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Toko</h1>
            <p className="text-gray-600 mt-1">Kelola data toko dan pelanggan</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Toko
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Toko Baru</DialogTitle>
                <DialogDescription>
                  Isi data toko dengan lengkap untuk menambahkan ke CRM
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama_toko">Nama Toko *</Label>
                    <Input
                      id="nama_toko"
                      value={formData.nama_toko}
                      onChange={(e) => setFormData({ ...formData, nama_toko: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pemilik">Nama Pemilik *</Label>
                    <Input
                      id="pemilik"
                      value={formData.pemilik}
                      onChange={(e) => setFormData({ ...formData, pemilik: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jalan">Nama Jalan *</Label>
                  <Input
                    id="jalan"
                    value={formData.jalan}
                    onChange={(e) => setFormData({ ...formData, jalan: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="no">No</Label>
                    <Input
                      id="no"
                      value={formData.no}
                      onChange={(e) => setFormData({ ...formData, no: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rt">RT</Label>
                    <Input
                      id="rt"
                      value={formData.rt}
                      onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rw">RW</Label>
                    <Input
                      id="rw"
                      value={formData.rw}
                      onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desa">Desa/Kelurahan</Label>
                  <Input
                    id="desa"
                    value={formData.desa}
                    onChange={(e) => setFormData({ ...formData, desa: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kecamatan">Kecamatan</Label>
                  <Input
                    id="kecamatan"
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kota">Kab/Kota *</Label>
                    <Input
                      id="kota"
                      value={formData.kota}
                      onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provinsi">Provinsi *</Label>
                    <Input
                      id="provinsi"
                      value={formData.provinsi}
                      onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    Simpan
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Toko</CardTitle>
            <CardDescription>Toko yang terdaftar dalam CRM Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari toko, pemilik, atau kota..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : filteredShops.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada toko terdaftar</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Toko</TableHead>
                      <TableHead>Pemilik</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShops.map((shop) => (
                      <TableRow key={shop.id}>
                        <TableCell className="font-medium">{shop.nama_toko}</TableCell>
                        <TableCell>{shop.pemilik}</TableCell>
                        <TableCell>
                          <div className="flex items-start gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{shop.kota}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {shop.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              <span>{shop.phone}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/dashboard/shops/${shop.id}`}>
                              <FileText className="w-4 h-4 mr-1" />
                              Detail
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
