# ⚡ SAMBEL PECEL LUDY - Quick Start Card

## ✅ Checklist Setup (5 Menit Selesai!)

### Step 1: Install & Run
```bash
npm install
npm run dev
```

### Step 2: Setup Database (2 menit)
1. Buka: https://supabase.com/dashboard
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy isi file: `supabase/migrations/002_sambel_pecel_ludy_schema.sql`
5. Paste & klik **Run** ✅

### Step 3: Setup Clerk Webhook (2 menit)
1. Buka: https://dashboard.clerk.com
2. Pilih aplikasi Anda
3. Menu **Webhooks** → **Add Endpoint**
   - URL: `http://localhost:3000/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
4. Copy **Signing Secret**
5. Tambahkan ke `.env.local`:
   ```env
   CLERK_SIGNING_SECRET=whsec_your_secret_here
   ```

### Step 4: Setup Supabase Integration (1 menit)
1. **Di Supabase Dashboard**:
   - Authentication → Integrations
   - Pilih **Clerk**
   - Ikuti wizard setup
   
2. **Di Clerk Dashboard**:
   - Connect with Supabase
   - Follow instructions

### Step 5: Get Service Role Key (1 menit)
1. Supabase Dashboard → Project Settings → API
2. Copy **service_role key** (bukan anon!)
3. Tambahkan ke `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Step 6: Test! 🚀
```bash
npm run dev
```
1. Buka http://localhost:3000
2. Klik **Sign Up**
3. Buat akun baru
4. Otomatis redirect ke Dashboard ✅

### Step 7: Setup Role User
1. Buka Supabase Dashboard → Table Editor → `profiles`
2. Cari user yang baru dibuat
3. Update kolom `role`:
   - `admin` - Full access
   - `supervisor` - Team manager
   - `sales` - Sales lapangan
4. Logout & login kembali

---

## 🎯 What's Next?

### Sebagai Sales:
- ✅ Tambah toko di CRM Toko
- ✅ Buat rencana kunjungan & cetak PDF
- ✅ Input transaksi harian
- ✅ Submit laporan harian
- ✅ Monitor gaji & target

### Sebagai Supervisor:
- ✅ Lihat tim sales
- ✅ Verifikasi laporan
- ✅ Monitor performa tim
- ✅ Update salary & target

### Sebagai Admin:
- ✅ Manage users
- ✅ Manage products
- ✅ Configure system

---

## 📁 File Structure

```
pecel-ludy-v0/
├── .env.local                          # ✅ Sudah ada (Clerk + Supabase)
├── BACKEND_SETUP.md                    # 📖 Backend documentation
├── QUICK_SETUP.md                      # 📖 Quick start guide
├── README_SAMBEL_PECEL_LUDY.md        # 📖 Full documentation
│
├── supabase/migrations/
│   └── 002_sambel_pecel_ludy_schema.sql  # 🗄️ RUN THIS FIRST!
│
├── src/
│   ├── app/
│   │   ├── api/                        # 🔧 Backend API Routes
│   │   │   ├── profile/               # User profile
│   │   │   ├── products/              # Product management
│   │   │   ├── shops/                 # Shop CRUD
│   │   │   ├── transactions/          # Sales transactions
│   │   │   ├── reports/               # Daily reports
│   │   │   ├── visits/                # Visit planner
│   │   │   ├── dashboard/stats/       # Dashboard data
│   │   │   ├── team/                  # Team management
│   │   │   ├── verification/          # Supervisor verification
│   │   │   └── webhooks/clerk/        # Clerk webhook
│   │   │
│   │   ├── sign-in/                   # Login page
│   │   ├── sign-up/                   # Register page
│   │   └── dashboard/                 # App pages
│   │       ├── shops/                 # CRM Toko
│   │       ├── visits/                # Visit Planner
│   │       ├── transactions/          # Input Transaksi
│   │       ├── daily-report/          # Laporan Harian
│   │       ├── salary/                # Gaji & Target
│   │       ├── verification/          # Verifikasi (SPV)
│   │       └── performance/           # Analytics (SPV)
│   │
│   ├── components/                    # React components
│   │   ├── dashboard-layout.tsx       # Main layout
│   │   ├── sales-dashboard.tsx        # Sales home
│   │   ├── supervisor-dashboard.tsx   # SPV home
│   │   └── admin-dashboard.tsx        # Admin home
│   │
│   └── lib/
│       ├── supabase.ts                # Supabase client
│       ├── helpers.ts                 # Utility functions
│       └── user.ts                    # User helpers
│
└── database/schema.sql                # Alternative schema
```

---

## 🔑 Environment Variables

```env
# ✅ Sudah Config
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YWxlcnQtc3dpbmUtOTQuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_BYTbOtDoib2WOXbGYtEP8KnX7pCUFsGxSJDSTkUtzU
NEXT_PUBLIC_SUPABASE_URL=https://mwkaqdagvesqzszkuwgk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# ⚠️ PERLU DITAMBAHKAN
CLERK_SIGNING_SECRET=whsec_your_signing_secret  # Dari Clerk Webhooks
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...  # Dari Supabase Settings
```

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| "Profile not found" | Jalankan migration & buat webhook |
| "Unauthorized" | Pastikan sudah login |
| "RLS error" | Cek RLS policies di Supabase |
| Webhook tidak jalan | Cek CLERK_SIGNING_SECRET |
| Data tidak muncul | Cek browser console untuk errors |

---

## 📞 Support Files

- **BACKEND_SETUP.md** - Detailed backend guide
- **QUICK_SETUP.md** - Quick start instructions  
- **README_SAMBEL_PECEL_LUDY.md** - Full documentation
- **SUPABASE_CLERK_SETUP.md** - Clerk + Supabase integration

---

**🎉 Aplikasi siap digunakan!**

Mulai dengan: `npm run dev` → Sign Up → Setup Role → Enjoy!
