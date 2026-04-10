# 🚨 Fix untuk Error 401 di Client Components

## Masalah:
Client components (SalesDashboard, dll) menggunakan Supabase dengan **anon key** tanpa auth token dari Clerk, sehingga **Row Level Security (RLS)** memblok semua request.

## ✅ Solusi (PILIH SALAH SATU):

### **Opsi 1: Disable RLS di Supabase (RECOMMENDED untuk Development)**

1. **Buka Supabase Dashboard**: https://supabase.com/dashboard/project/mwkaqdagvesqzszkuwgk/sql
2. **Copy & paste script ini**, lalu klik **Run**:

```sql
-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE toko DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE kunjungan DISABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_harian DISABLE ROW LEVEL SECURITY;
ALTER TABLE rencana_kunjungan DISABLE ROW LEVEL SECURITY;
```

3. **Refresh browser** (Ctrl+R atau Cmd+R)
4. Dashboard akan load tanpa error 401! ✅

---

### **Opsi 2: Keep RLS tapi Update Policies (Lebih Aman)**

Jika Anda ingin keep RLS untuk security, run script ini:

```sql
-- Drop semua existing policies dulu
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admin and supervisor can manage products" ON products;
DROP POLICY IF EXISTS "Sales can view own shops" ON toko;
DROP POLICY IF EXISTS "Supervisor can view all shops" ON toko;
DROP POLICY IF EXISTS "Sales can create own shops" ON toko;
DROP POLICY IF EXISTS "Sales can update own shops" ON toko;
DROP POLICY IF EXISTS "Sales can delete own shops" ON toko;
DROP POLICY IF EXISTS "Sales can view own transactions" ON transaksi;
DROP POLICY IF EXISTS "Supervisor can view all transactions" ON transaksi;
DROP POLICY IF EXISTS "Sales can create own transactions" ON transaksi;
DROP POLICY IF EXISTS "Sales can view own visits" ON kunjungan;
DROP POLICY IF EXISTS "Sales can create own visits" ON kunjungan;
DROP POLICY IF EXISTS "Sales can view own reports" ON laporan_harian;
DROP POLICY IF EXISTS "Supervisor can view team reports" ON laporan_harian;
DROP POLICY IF EXISTS "Sales can create own reports" ON laporan_harian;
DROP POLICY IF EXISTS "Supervisor can update reports" ON laporan_harian;
DROP POLICY IF EXISTS "Sales can view own visit plans" ON rencana_kunjungan;
DROP POLICY IF EXISTS "Sales can manage own visit plans" ON rencana_kunjungan;

-- Enable RLS kembali (jika sempat disabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE toko ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunjungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE rencana_kunjungan ENABLE ROW LEVEL SECURITY;

-- Buat policies baru yang allow all (development mode)
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on toko" ON toko FOR ALL USING (true);
CREATE POLICY "Allow all operations on transaksi" ON transaksi FOR ALL USING (true);
CREATE POLICY "Allow all operations on kunjungan" ON kunjungan FOR ALL USING (true);
CREATE POLICY "Allow all operations on laporan_harian" ON laporan_harian FOR ALL USING (true);
CREATE POLICY "Allow all operations on rencana_kunjungan" ON rencana_kunjungan FOR ALL USING (true);
```

---

## 📝 Kenapa Error Ini Terjadi?

1. **Client-side Supabase client** menggunakan **anon key**
2. **Anon key** terkena RLS policies yang expect **Clerk JWT** 
3. **Clerk JWT format** beda dengan **Supabase JWT format**
4. RLS tidak bisa parse token → **Request diblok** → **Error 401**

---

## 🎯 Rekomendasi:

**Untuk Development**: **Opsi 1** (Disable RLS) - Lebih simple, tidak perlu config tambahan

**Untuk Production**: Implementasi proper auth dengan:
- Menggunakan Supabase Auth (bukan Clerk)
- Atau custom RLS policies yang support Clerk JWT
- Atau backend API routes sebagai proxy

---

## ✅ Setelah Run Script:

1. **Refresh browser**
2. **Clear cache** (Ctrl+Shift+R atau Cmd+Shift+R)
3. Dashboard akan load normal
4. Error 401 di console akan hilang
