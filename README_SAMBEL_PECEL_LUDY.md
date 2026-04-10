# 🌶️ SAMBEL PECEL LUDY - Sistem Penjualan

Aplikasi manajemen penjualan untuk **Sambel Pecel Ludy** dengan fitur lengkap untuk pengelolaan tim sales, CRM toko, tracking transaksi, dan perhitungan gaji otomatis.

## 🚀 Fitur Utama

### 👤 Role-Based Access Control
- **Admin**: Manajemen pengguna, produk, dan konfigurasi sistem
- **Supervisor**: Monitoring tim, verifikasi laporan, dan analisis performa
- **Sales**: CRM toko, input transaksi, rencana kunjungan, dan laporan harian

### 🏪 CRM Toko (Sales)
- Registrasi toko dengan alamat lengkap (Jalan, RT/RW, Desa, Kecamatan, Kota, Provinsi)
- Riwayat kunjungan dan transaksi per toko
- Pencarian dan filtering toko

### 📅 Visit Planner
- Rencana kunjungan harian dengan kalender interaktif
- Pilihan multi-toko sekaligus
- **Cetak PDF** untuk panduan fisik di lapangan
- Tracking status kunjungan

### 💰 Sales Tracking & Transaction
- Input transaksi dengan shopping cart interface
- Pemilihan produk dan quantity yang mudah
- Catatan kunjungan per transaksi
- Riwayat transaksi real-time

### 📊 Salary Engine (Automated)
- **Real-time progress** target bulanan
- **Perhitungan otomatis**: Gaji Pokok - Potongan (10% dari selisih target)
- **Proyeksi akhir bulan** berdasarkan rata-rata penjualan
- **Warning system** untuk penjualan di bawah target
- Rekomendasi penjualan harian untuk mencapai target

### ✅ Verification & Performance (Supervisor)
- Antrian verifikasi laporan harian
- Approval/Rejection dengan catatan
- Grafik performa tim (Bar chart, Line chart)
- Statistik individual per sales

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner

## 📦 Setup & Installation

### Prerequisites
- Node.js 20+
- Akun [Clerk](https://clerk.com)
- Akun [Supabase](https://supabase.com)

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env.local` dan isi dengan konfigurasi:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Setup Supabase Database

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy paste seluruh isi file `database/schema.sql`
3. Jalankan script untuk membuat tabel, index, RLS policies, dan sample data

### 4. Setup Clerk + Supabase Integration

Ikuti panduan lengkap di file `SUPABASE_CLERK_SETUP.md`:

1. Konfigurasi **Third-Party Auth** di Supabase
2. Hubungkan dengan **Clerk** di dashboard
3. Configure JWT claims

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Struktur Database

### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `profiles` | Data pengguna dengan role, gaji, dan target |
| `products` | Master produk sambel pecel |
| `toko` | Data toko/pelanggan dengan alamat lengkap |
| `transaksi` | Riwayat penjualan produk |
| `kunjungan` | Log kunjungan sales ke toko |
| `laporan_harian` | Laporan kehadiran harian sales |
| `rencana_kunjungan` | Rencana kunjungan yang dijadwalkan |

### Skema Lengkap

Lihat file `database/schema.sql` untuk SQL lengkap dengan RLS policies.

## 🎯 User Flow

### A. Alur Setup (Awal Bulan)
1. **Admin** membuat akun untuk Supervisor dan Sales via Clerk
2. **Admin/Supervisor** input target bulanan dan gaji pokok untuk setiap sales
3. **Sales** melihat target di dashboard mereka

### B. Alur Kerja Harian (Operasional)
1. **Pagi**: Sales membuka aplikasi → melihat "Rencana Kunjungan"
2. **Cetak PDF** daftar toko yang akan dikunjungi
3. **Di Lapangan**:
   - Tambah toko baru via form CRM (jika perlu)
   - Input transaksi per kunjungan
4. **Sore**: Sales klik **"Kirim Laporan Harian"**

### C. Alur Verifikasi & Penggajian
1. **Supervisor** menerima notifikasi laporan masuk
2. Verifikasi laporan → Status kehadiran sales menjadi "Hadir"
3. **Sistem otomatis update** dashboard gaji:
   - Capaian: Rp X
   - Potongan: Rp Y (jika ada)
   - Estimasi Gaji: Rp Z

## 🔐 Row Level Security (RLS)

Database sudah dilengkapi dengan RLS policies untuk:
- ✅ Sales hanya bisa melihat data mereka sendiri
- ✅ Supervisor bisa melihat semua data tim mereka
- ✅ Admin bisa melihat semua data
- ✅ Produk aktif bisa dilihat semua user

## 📱 Responsive Design

Aplikasi ini fully responsive dan mobile-friendly untuk penggunaan di lapangan via smartphone.

## 🎨 UI Components

Menggunakan **shadcn/ui** components yang sudah terinstall:
- Card, Button, Dialog, Table, Badge, Progress
- Calendar, Checkbox, Select, Input, Textarea
- Separator, dan lainnya

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
```

1. Push ke GitHub
2. Connect ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy!

## 📝 Catatan Penting

### Membuat User Pertama
1. Sign up via `/sign-up`
2. Buka Supabase → table `profiles`
3. Update role user tersebut menjadi `admin` atau `supervisor`
4. Login kembali

### Menambah Produk
Admin bisa menambah produk via menu "Master Produk" atau langsung via Supabase dashboard.

### Custom Gaji & Target
Supervisor bisa mengatur gaji pokok dan target per sales via menu "Manajemen Tim".

## 🐛 Troubleshooting

### Authentication Error
- Pastikan Clerk dan Supabase sudah terkoneksi via Third-Party Auth
- Cek JWT token di browser dev tools
- Pastikan environment variables benar

### RLS Policy Errors
- Pastikan user sudah punya record di `profiles` table
- Cek role user sudah sesuai
- Verifikasi Third-Party Auth setup di Supabase

### Data Tidak Muncul
- Cek RLS policies di Supabase
- Pastikan `sales_id` atau `supervisor_id` sesuai
- Lihat browser console untuk error messages

## 📄 License

Proprietary - Sambel Pecel Ludy

## 👥 Support

Untuk pertanyaan atau bantuan, hubungi tim development.

---

**Dibuat dengan ❤️ untuk Sambel Pecel Ludy**
