-- Disable RLS temporarily for development
-- Run this in Supabase SQL Editor to fix auth issues

-- Disable RLS on all tables for development
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE toko DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE kunjungan DISABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_harian DISABLE ROW LEVEL SECURITY;
ALTER TABLE rencana_kunjungan DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled, update policies to work with Clerk
-- Uncomment the section below if you want to keep RLS enabled

/*
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;

-- Create new policies that work without JWT
CREATE POLICY "Public read access for profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Allow all operations for service role"
  ON profiles FOR ALL USING (true);

-- Repeat for other tables...
*/
