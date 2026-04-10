-- SAMBEL PECEL LUDY - Complete Database Schema
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. PROFILES TABLE (Extended User Data)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'supervisor', 'sales')),
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
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor ON profiles(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_toko_sales ON toko(sales_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_toko ON transaksi(toko_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_sales ON transaksi(sales_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_created ON transaksi(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaksi_verified ON transaksi(is_verified);
CREATE INDEX IF NOT EXISTS idx_kunjungan_toko ON kunjungan(toko_id);
CREATE INDEX IF NOT EXISTS idx_kunjungan_sales ON kunjungan(sales_id);
CREATE INDEX IF NOT EXISTS idx_laporan_sales_tanggal ON laporan_harian(sales_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON laporan_harian(status_hadir);
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
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_toko_updated_at ON toko;
CREATE TRIGGER update_toko_updated_at BEFORE UPDATE ON toko
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- FUNCTION: Get sales monthly summary
-- ==========================================
CREATE OR REPLACE FUNCTION get_sales_monthly_summary(
  p_sales_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  total_sales NUMERIC,
  transaction_count BIGINT,
  shops_visited INTEGER,
  attendance_days INTEGER,
  progress_percentage NUMERIC,
  penalty_amount NUMERIC,
  estimated_salary NUMERIC
) AS $$
DECLARE
  v_monthly_target NUMERIC;
  v_base_salary NUMERIC;
  v_total_sales NUMERIC;
  v_txn_count BIGINT;
  v_shops_visited INTEGER;
  v_attendance INTEGER;
BEGIN
  -- Get user's target and salary
  SELECT monthly_target, base_salary 
  INTO v_monthly_target, v_base_salary
  FROM profiles 
  WHERE id = p_sales_id;

  -- Calculate total sales
  SELECT COALESCE(SUM(total_harga), 0), COUNT(*)
  INTO v_total_sales, v_txn_count
  FROM transaksi
  WHERE sales_id = p_sales_id
    AND EXTRACT(MONTH FROM created_at) = p_month
    AND EXTRACT(YEAR FROM created_at) = p_year;

  -- Count unique shops visited
  SELECT COUNT(DISTINCT toko_id)
  INTO v_shops_visited
  FROM kunjungan
  WHERE sales_id = p_sales_id
    AND EXTRACT(MONTH FROM created_at) = p_month
    AND EXTRACT(YEAR FROM created_at) = p_year;

  -- Count attendance days
  SELECT COUNT(*)
  INTO v_attendance
  FROM laporan_harian
  WHERE sales_id = p_sales_id
    AND status_hadir = 'hadir'
    AND EXTRACT(MONTH FROM tanggal) = p_month
    AND EXTRACT(YEAR FROM tanggal) = p_year;

  -- Calculate metrics
  RETURN QUERY SELECT
    v_total_sales,
    v_txn_count,
    v_shops_visited,
    v_attendance,
    CASE WHEN v_monthly_target > 0 THEN (v_total_sales / v_monthly_target * 100) ELSE 0 END,
    CASE WHEN v_total_sales < v_monthly_target THEN (v_monthly_target - v_total_sales) * 0.1 ELSE 0 END,
    v_base_salary - CASE WHEN v_total_sales < v_monthly_target THEN (v_monthly_target - v_total_sales) * 0.1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.clerk_id = auth.jwt() ->> 'sub' 
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
CREATE POLICY "Admin can delete profiles"
  ON profiles FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.clerk_id = auth.jwt() ->> 'sub' 
      AND profiles.role = 'admin'
    )
  );

-- Products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin and supervisor can manage products" ON products;
CREATE POLICY "Admin and supervisor can manage products"
  ON products FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.clerk_id = auth.jwt() ->> 'sub' 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

-- Toko policies
DROP POLICY IF EXISTS "Sales can view own shops" ON toko;
CREATE POLICY "Sales can view own shops"
  ON toko FOR SELECT USING (sales_id = id);

DROP POLICY IF EXISTS "Supervisor can view all shops" ON toko;
CREATE POLICY "Supervisor can view all shops"
  ON toko FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.clerk_id = auth.jwt() ->> 'sub' 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

DROP POLICY IF EXISTS "Sales can create own shops" ON toko;
CREATE POLICY "Sales can create own shops"
  ON toko FOR INSERT WITH CHECK (sales_id = id);

DROP POLICY IF EXISTS "Sales can update own shops" ON toko;
CREATE POLICY "Sales can update own shops"
  ON toko FOR UPDATE USING (sales_id = id);

DROP POLICY IF EXISTS "Sales can delete own shops" ON toko;
CREATE POLICY "Sales can delete own shops"
  ON toko FOR DELETE USING (sales_id = id);

-- Transaksi policies
DROP POLICY IF EXISTS "Sales can view own transactions" ON transaksi;
CREATE POLICY "Sales can view own transactions"
  ON transaksi FOR SELECT USING (sales_id = id);

DROP POLICY IF EXISTS "Supervisor can view all transactions" ON transaksi;
CREATE POLICY "Supervisor can view all transactions"
  ON transaksi FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.clerk_id = auth.jwt() ->> 'sub' 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

DROP POLICY IF EXISTS "Sales can create own transactions" ON transaksi;
CREATE POLICY "Sales can create own transactions"
  ON transaksi FOR INSERT WITH CHECK (sales_id = id);

-- Kunjungan policies
DROP POLICY IF EXISTS "Sales can view own visits" ON kunjungan;
CREATE POLICY "Sales can view own visits"
  ON kunjungan FOR SELECT USING (sales_id = id);

DROP POLICY IF EXISTS "Sales can create own visits" ON kunjungan;
CREATE POLICY "Sales can create own visits"
  ON kunjungan FOR INSERT WITH CHECK (sales_id = id);

-- Laporan harian policies
DROP POLICY IF EXISTS "Sales can view own reports" ON laporan_harian;
CREATE POLICY "Sales can view own reports"
  ON laporan_harian FOR SELECT USING (sales_id = id);

DROP POLICY IF EXISTS "Supervisor can view team reports" ON laporan_harian;
CREATE POLICY "Supervisor can view team reports"
  ON laporan_harian FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.clerk_id = auth.jwt() ->> 'sub' 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

DROP POLICY IF EXISTS "Sales can create own reports" ON laporan_harian;
CREATE POLICY "Sales can create own reports"
  ON laporan_harian FOR INSERT WITH CHECK (sales_id = id);

DROP POLICY IF EXISTS "Supervisor can update reports" ON laporan_harian;
CREATE POLICY "Supervisor can update reports"
  ON laporan_harian FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.clerk_id = auth.jwt() ->> 'sub' 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

-- Rencana kunjungan policies
DROP POLICY IF EXISTS "Sales can view own visit plans" ON rencana_kunjungan;
CREATE POLICY "Sales can view own visit plans"
  ON rencana_kunjungan FOR SELECT USING (sales_id = id);

DROP POLICY IF EXISTS "Sales can manage own visit plans" ON rencana_kunjungan;
CREATE POLICY "Sales can manage own visit plans"
  ON rencana_kunjungan FOR ALL USING (sales_id = id);

-- ==========================================
-- SAMPLE DATA (Optional)
-- ==========================================

-- Insert sample products if table is empty
INSERT INTO products (name, description, size, price, stock)
SELECT * FROM (VALUES
  ('Sambel Pecel Original', 'Sambel pecel khas dengan resep rahasia', '250gr', 15000, 100),
  ('Sambel Pecel Pedas', 'Sambel pecel dengan level pedas', '250gr', 15000, 100),
  ('Sambel Pecel Extra Pedas', 'Sambel pecel untuk pecinta pedas', '250gr', 18000, 80),
  ('Sambel Pecel Family Pack', 'Ukuran lebih hemat untuk keluarga', '500gr', 28000, 50)
) AS v(name, description, size, price, stock)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
