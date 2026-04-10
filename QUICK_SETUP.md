# SAMBEL PECEL LUDY - Quick Setup Guide

## 🚀 Langkah Setup Cepat

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy dan paste ini ke `.env.local`:

```env
# Clerk (dapatkan dari https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase (dapatkan dari https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Setup Database di Supabase

1. Buka **Supabase Dashboard**
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy semua isi file `database/schema.sql`
5. Paste dan klik **Run**

Ini akan membuat:
- ✅ 7 tabel (profiles, products, toko, transaksi, kunjungan, laporan_harian, rencana_kunjungan)
- ✅ Indexes untuk performance
- ✅ Row Level Security (RLS) policies
- ✅ Sample products (4 varian sambel pecel)

### 4. Connect Clerk + Supabase

1. **Di Supabase**:
   - Authentication → Integrations
   - Tambah Third-Party Auth: Clerk

2. **Di Clerk**:
   - Dashboard → Connect with Supabase
   - Ikuti setup wizard

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka: http://localhost:3000

### 6. Setup User Pertama

1. **Sign Up** akun pertama via `/sign-up`
2. Buka **Supabase** → Table Editor → `profiles`
3. Cari user Anda, update kolom `role`:
   - `admin` - Untuk akses penuh
   - `supervisor` - Untuk supervision tim
   - `sales` - Untuk sales lapangan
4. Logout dan login kembali

### 7. Mulai Menggunakan

#### Sebagai Admin:
- Tambah user (Supervisor & Sales)
- Setup produk di Master Produk
- Configure gaji & target

#### Sebagai Supervisor:
- Lihat tim sales di bawah Anda
- Verifikasi laporan harian
- Monitor performa tim

#### Sebagai Sales:
- Tambah toko baru di CRM Toko
- Buat rencana kunjungan & cetak PDF
- Input transaksi harian
- Submit laporan harian
- Monitor gaji & target

---

## 📋 Test Checklist

Setelah setup, pastikan ini berfungsi:

- [ ] Bisa sign up / sign in
- [ ] Dashboard muncul sesuai role
- [ ] Sidebar navigasi berfungsi
- [ ] Bisa tambah toko (untuk sales)
- [ ] Bisa input transaksi
- [ ] Bisa kirim laporan harian
- [ ] Progress target terupdate
- [ ] Perhitungan gaji benar

---

## 🆘 Troubleshooting

**"Could not find profile"**
- Pastikan user sudah punya record di tabel `profiles`
- Cek `clerk_id` sesuai dengan user ID dari Clerk

**"RLS policy violation"**
- Pastikan Third-Party Auth Clerk sudah dikonfigurasi di Supabase
- Cek environment variables sudah benar

**Data tidak muncul**
- Cek browser console untuk error
- Pastikan token Clerk terkirim ke Supabase
- Coba logout dan login kembali

---

**Selamat! Aplikasi SAMBEL PECEL LUDY siap digunakan! 🌶️**
