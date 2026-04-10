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
import { Plus, Store, Search, MapPin, Phone, FileText, Edit2, Trash2, AlertTriangle } from "lucide-react";
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
  last_transaction?: string | null;
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
  const [editMode, setEditMode] = useState(false);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingShop, setDeletingShop] = useState<Toko | null>(null);

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
      
      // Fetch last transaction for each shop
      const shopsWithLastTransaction = await Promise.all(
        (data || []).map(async (shop) => {
          const { data: transData } = await supabase
            .from("transaksi")
            .select("created_at")
            .eq("toko_id", shop.id)
            .order("created_at", { ascending: false })
            .limit(1);

          return {
            ...shop,
            last_transaction: transData && transData.length > 0 ? transData[0].created_at : null,
          };
        })
      );

      setShops(shopsWithLastTransaction);
    } catch (error: any) {
      toast.error("Gagal memuat data toko: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editMode && editingShopId) {
        // Update existing shop
        const { error } = await supabase
          .from("toko")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingShopId);

        if (error) throw error;

        toast.success("Toko berhasil diupdate!");
      } else {
        // Create new shop
        const { error } = await supabase.from("toko").insert({
          ...formData,
          sales_id: user!.id,
        });

        if (error) throw error;

        toast.success("Toko berhasil ditambahkan!");
      }

      setDialogOpen(false);
      resetForm();
      fetchShops();
    } catch (error: any) {
      toast.error(editMode ? "Gagal mengupdate toko: " + error.message : "Gagal menambahkan toko: " + error.message);
    }
  };

  const handleEdit = (shop: Toko) => {
    setFormData({
      nama_toko: shop.nama_toko,
      pemilik: shop.pemilik,
      jalan: shop.jalan,
      no: shop.no,
      rt: shop.rt,
      rw: shop.rw,
      desa: shop.desa,
      kecamatan: shop.kecamatan,
      kota: shop.kota,
      provinsi: shop.provinsi,
      phone: shop.phone,
      notes: shop.notes,
    });
    setEditingShopId(shop.id);
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingShop) return;

    try {
      const { error } = await supabase
        .from("toko")
        .delete()
        .eq("id", deletingShop.id);

      if (error) throw error;

      toast.success("Toko berhasil dihapus!");
      setDeleteDialogOpen(false);
      setDeletingShop(null);
      fetchShops();
    } catch (error: any) {
      toast.error("Gagal menghapus toko: " + error.message);
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
    setEditMode(false);
    setEditingShopId(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const filteredShops = shops.filter((shop) =>
    shop.nama_toko.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.pemilik.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.kota.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLastTransaction = (dateStr: string | null) => {
    if (!dateStr) return "Belum ada transaksi";
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Baru saja";
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

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
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Toko
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit Toko" : "Tambah Toko Baru"}</DialogTitle>
                <DialogDescription>
                  {editMode ? "Ubah data toko dengan lengkap" : "Isi data toko dengan lengkap untuk menambahkan ke CRM"}
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
                      <TableHead>Transaksi Terakhir</TableHead>
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
                            <span>{shop.kota} / {shop.kecamatan}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {shop.phone && (
                              <div className="flex items-center gap-1 mb-1">
                                <Phone className="w-3 h-3" />
                                <span>{shop.phone}</span>
                              </div>
                            )}
                            <div className={`text-xs ${
                              shop.last_transaction ? 'text-gray-500' : 'text-orange-600'
                            }`}>
                              {formatLastTransaction(shop.last_transaction ?? null)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(shop)}
                            >
                              <Edit2 className="w-4 h-4 mr-1 text-blue-600" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeletingShop(shop);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Hapus
                            </Button>
                          </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Hapus Toko
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus toko ini? Semua data transaksi terkait juga akan terhapus.
            </DialogDescription>
          </DialogHeader>

          {deletingShop && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium mb-2 text-red-900">Detail Toko</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama Toko:</span>
                    <span className="font-medium">{deletingShop.nama_toko}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pemilik:</span>
                    <span className="font-medium">{deletingShop.pemilik}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lokasi:</span>
                    <span className="font-medium">{deletingShop.kota}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
