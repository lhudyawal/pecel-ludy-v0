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
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
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

      const { data: transactionsData } = await supabase
        .from("transaksi")
        .select("*, toko:nama_toko, product:name")
        .eq("sales_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setShops(shopsData || []);
      setProducts(productsData || []);
      setTransactions(transactionsData || []);
    } catch (error: any) {
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
                <div className="text-center py-8 text-gray-500">Belum ada transaksi</div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 20).map((transaction) => (
                    <div key={transaction.id} className="p-3 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{transaction.toko?.nama_toko}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.product?.name} x{transaction.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-orange-600">
                          {formatCurrency(transaction.total_harga)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
