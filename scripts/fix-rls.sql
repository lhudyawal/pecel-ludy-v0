-- =====================================================
-- FIX: Disable RLS untuk Development
-- Copy script ini ke Supabase SQL Editor dan Run
-- =====================================================

-- Disable RLS on all tables untuk fix error 401
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE toko DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE kunjungan DISABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_harian DISABLE ROW LEVEL SECURITY;
ALTER TABLE rencana_kunjungan DISABLE ROW LEVEL SECURITY;

-- Verifikasi: Semua table seharusnya menunjukkan "RLS: disabled"
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
