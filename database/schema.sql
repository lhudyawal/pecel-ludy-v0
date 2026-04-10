-- SAMBEL PECEL LUDY Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ==========================================
-- 1. PROFILES TABLE (Extended User Data)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clerk_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'sales')),
  supervisor_id UUID REFERENCES profiles(id),
  base_salary NUMERIC(15, 2) DEFAULT 2200000,
  monthly_target NUMERIC(15, 2) DEFAULT 10000000,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  size TEXT NOT NULL,
  price NUMERIC(15, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. TOKO (SHOPS) TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS toko (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nama_toko TEXT NOT NULL,
  pemilik TEXT NOT NULL,
  jalan TEXT NOT NULL,
  no TEXT,
  rt TEXT,
  rw TEXT,
  desa TEXT,
  kecamatan TEXT,
  kota TEXT,
  provinsi TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. TRANSAKSI (TRANSACTIONS) TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toko_id UUID NOT NULL REFERENCES toko(id) ON DELETE CASCADE,
  sales_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_harga NUMERIC(15, 2) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. KUNJUNGAN (VISITS) TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS kunjungan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toko_id UUID NOT NULL REFERENCES toko(id) ON DELETE CASCADE,
  sales_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. LAPORAN_HARIAN (DAILY REPORTS) TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS laporan_harian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  status_hadir TEXT DEFAULT 'pending' CHECK (status_hadir IN ('hadir', 'alpa', 'pending')),
  supervisor_notes TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sales_id, tanggal)
);

-- ==========================================
-- 7. RENCANA_KUNJUNGAN (VISIT PLANS) TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS rencana_kunjungan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toko_id UUID NOT NULL REFERENCES toko(id) ON DELETE CASCADE,
  sales_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tanggal_rencana DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor ON profiles(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_toko_sales ON toko(sales_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_toko ON transaksi(toko_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_sales ON transaksi(sales_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_created ON transaksi(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kunjungan_toko ON kunjungan(toko_id);
CREATE INDEX IF NOT EXISTS idx_kunjungan_sales ON kunjungan(sales_id);
CREATE INDEX IF NOT EXISTS idx_laporan_sales_tanggal ON laporan_harian(sales_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_rencana_sales_tanggal ON rencana_kunjungan(sales_id, tanggal_rencana);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_toko_updated_at BEFORE UPDATE ON toko
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE toko ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunjungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE rencana_kunjungan ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

-- Products policies
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT USING (is_active = true);

CREATE POLICY "Admin and supervisor can manage products"
  ON products FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

-- Toko policies
CREATE POLICY "Sales can view own shops"
  ON toko FOR SELECT USING (sales_id = auth.uid());

CREATE POLICY "Supervisor can view all shops"
  ON toko FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Sales can create own shops"
  ON toko FOR INSERT WITH CHECK (sales_id = auth.uid());

CREATE POLICY "Sales can update own shops"
  ON toko FOR UPDATE USING (sales_id = auth.uid());

-- Transaksi policies
CREATE POLICY "Sales can view own transactions"
  ON transaksi FOR SELECT USING (sales_id = auth.uid());

CREATE POLICY "Supervisor can view all transactions"
  ON transaksi FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Sales can create own transactions"
  ON transaksi FOR INSERT WITH CHECK (sales_id = auth.uid());

-- Kunjungan policies
CREATE POLICY "Sales can view own visits"
  ON kunjungan FOR SELECT USING (sales_id = auth.uid());

CREATE POLICY "Sales can create own visits"
  ON kunjungan FOR INSERT WITH CHECK (sales_id = auth.uid());

-- Laporan harian policies
CREATE POLICY "Sales can view own reports"
  ON laporan_harian FOR SELECT USING (sales_id = auth.uid());

CREATE POLICY "Supervisor can view team reports"
  ON laporan_harian FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Sales can create own reports"
  ON laporan_harian FOR INSERT WITH CHECK (sales_id = auth.uid());

CREATE POLICY "Supervisor can update reports"
  ON laporan_harian FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

-- Rencana kunjungan policies
CREATE POLICY "Sales can view own visit plans"
  ON rencana_kunjungan FOR SELECT USING (sales_id = auth.uid());

CREATE POLICY "Sales can manage own visit plans"
  ON rencana_kunjungan FOR ALL USING (sales_id = auth.uid());

-- ==========================================
-- SAMPLE DATA (Optional)
-- ==========================================

-- Insert sample products
INSERT INTO products (name, description, size, price, stock) VALUES
  ('Sambel Pecel Original', 'Sambel pecel khas dengan resep rahasia', '250gr', 15000, 100),
  ('Sambel Pecel Pedas', 'Sambel pecel dengan level pedas', '250gr', 15000, 100),
  ('Sambel Pecel Extra Pedas', 'Sambel pecel untuk pecinta pedas', '250gr', 18000, 80),
  ('Sambel Pecel Family Pack', 'Ukuran lebih hemat untuk keluarga', '500gr', 28000, 50)
ON CONFLICT DO NOTHING;
