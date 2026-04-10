"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Minus, Trash2, Edit2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/helpers";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface Toko {
  id: string;
  nama_toko: string;
  pemilik: string;
  kota: string;
}

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function TransactionsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<Profile | null>(null);
  const [shops, setShops] = useState<Toko[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedShop, setSelectedShop] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editQuantity, setEditQuantity] = useState(1);

  useEffect(() => {
    if (clerkUser) {
      fetchUserProfile();
    }
  }, [clerkUser]);

  useEffect(() => {
    if (user) {
      fetchData();
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

  const fetchData = async () => {
    try {
      const { data: shopsData } = await supabase
        .from("toko")
        .select("id, nama_toko, pemilik, kota")
        .eq("sales_id", user!.id)
        .order("nama_toko");

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      // Fetch transactions with proper joins
      const { data: transactionsData, error } = await supabase
        .from("transaksi")
        .select(`
          *,
          toko:toko(
            id,
            nama_toko,
            pemilik,
            kota
          ),
          product:products(
            id,
            name,
            size,
            price
          )
        `)
        .eq("sales_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Gagal memuat data transaksi: " + error.message);
      }

      setShops(shopsData || []);
      setProducts(productsData || []);
      setTransactions(transactionsData || []);
    } catch (error: any) {
      console.error("Error in fetchData:", error);
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleSubmit = async () => {
    if (!selectedShop) {
      toast.error("Pilih toko terlebih dahulu");
      return;
    }

    if (cart.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }

    try {
      const transactionData = cart.map((item) => ({
        toko_id: selectedShop,
        sales_id: user!.id,
        product_id: item.product.id,
        quantity: item.quantity,
        total_harga: item.product.price * item.quantity,
        notes: notes,
      }));

      const { error } = await supabase.from("transaksi").insert(transactionData);

      if (error) throw error;

      // Also create a kunjungan record
      await supabase.from("kunjungan").insert({
        toko_id: selectedShop,
        sales_id: user!.id,
        catatan: notes,
      });

      toast.success("Transaksi berhasil disimpan!");
      setCart([]);
      setNotes("");
      setSelectedShop("");
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menyimpan transaksi: " + error.message);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setEditQuantity(transaction.quantity);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTransaction) return;

    try {
      const newTotal = editingTransaction.product.price * editQuantity;
      
      const { error } = await supabase
        .from("transaksi")
        .update({
          quantity: editQuantity,
          total_harga: newTotal,
        })
        .eq("id", editingTransaction.id);

      if (error) throw error;

      toast.success("Transaksi berhasil diupdate!");
      setEditDialogOpen(false);
      setEditingTransaction(null);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal mengupdate transaksi: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingTransaction) return;

    try {
      const { error } = await supabase
        .from("transaksi")
        .delete()
        .eq("id", deletingTransaction.id);

      if (error) throw error;

      toast.success("Transaksi berhasil dihapus!");
      setDeleteDialogOpen(false);
      setDeletingTransaction(null);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus transaksi: " + error.message);
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Input Transaksi</h1>
          <p className="text-gray-600 mt-1">Catat penjualan per kunjungan</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transaction Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Transaksi Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select Shop */}
              <div className="space-y-2">
                <Label htmlFor="shop">Pilih Toko *</Label>
                <Select value={selectedShop} onValueChange={setSelectedShop}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih toko yang dikunjungi" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.nama_toko} - {shop.pemilik} ({shop.kota})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Products */}
              <div className="space-y-2">
                <Label>Produk</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:border-orange-300 transition-colors"
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{product.name}</h4>
                            <p className="text-xs text-gray-500">{product.size}</p>
                            <p className="text-sm font-semibold text-orange-600 mt-1">
                              {formatCurrency(product.price)}
                            </p>
                            <p className="text-xs text-gray-500">Stok: {product.stock}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(product)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div className="space-y-2">
                  <Label>Keranjang ({cart.length} item)</Label>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-[50px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.product.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{item.product.name}</p>
                                <p className="text-xs text-gray-500">{formatCurrency(item.product.price)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.product.id, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.product.id, 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.product.price * item.quantity)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {formatCurrency(getTotal())}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Kunjungan</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk kunjungan ini..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedShop || cart.length === 0}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Simpan Transaksi
              </Button>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>50 transaksi terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Belum ada transaksi</p>
                  <p className="text-sm mt-1">Mulai input transaksi pertama Anda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 20).map((transaction) => (
                    <div key={transaction.id} className="p-3 rounded-lg border hover:border-orange-200 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{transaction.toko?.nama_toko || "Toko tidak diketahui"}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.product?.name || "Produk"} ({transaction.product?.size}) x{transaction.quantity}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="font-semibold text-orange-600">
                            {formatCurrency(transaction.total_harga)}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit2 className="w-3 h-3 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => {
                                setDeletingTransaction(transaction);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length > 20 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      Menampilkan 20 dari {transactions.length} transaksi
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Edit Transaksi
            </DialogTitle>
            <DialogDescription>
              Ubah jumlah produk untuk transaksi ini
            </DialogDescription>
          </DialogHeader>

          {editingTransaction && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Detail Transaksi</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toko:</span>
                    <span className="font-medium">{editingTransaction.toko?.nama_toko}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Produk:</span>
                    <span className="font-medium">{editingTransaction.product?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harga:</span>
                    <span className="font-medium">{formatCurrency(editingTransaction.product?.price)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-qty">Jumlah Produk</Label>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    id="edit-qty"
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                    className="w-24 text-center"
                    min="1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditQuantity(editQuantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Baru:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(editingTransaction.product?.price * editQuantity)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleUpdate}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Hapus Transaksi
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini?
            </DialogDescription>
          </DialogHeader>

          {deletingTransaction && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium mb-2 text-red-900">Detail Transaksi</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toko:</span>
                    <span className="font-medium">{deletingTransaction.toko?.nama_toko}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Produk:</span>
                    <span className="font-medium">{deletingTransaction.product?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah:</span>
                    <span className="font-medium">{deletingTransaction.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(deletingTransaction.total_harga)}</span>
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
