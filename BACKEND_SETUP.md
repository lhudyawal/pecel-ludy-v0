# 🔧 SAMBEL PECEL LUDY - Backend Setup Guide

## 📋 Overview

Backend untuk aplikasi SAMBEL PECEL LUDY terdiri dari:
- **Database**: Supabase (PostgreSQL) dengan Row Level Security
- **Authentication**: Clerk dengan webhook sync ke database
- **API Routes**: Next.js API routes dengan role-based access control
- **Server Functions**: PostgreSQL functions untuk reporting

## 🚀 Setup Steps

### 1. Run Database Migration

**PENTING**: Jalankan migration ini di Supabase SQL Editor:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy semua isi file `supabase/migrations/002_sambel_pecel_ludy_schema.sql`
5. Paste dan klik **Run**

Migration ini akan membuat:
- ✅ 7 tabel utama (profiles, products, toko, transaksi, kunjungan, laporan_harian, rencana_kunjungan)
- ✅ Indexes untuk performa
- ✅ Row Level Security (RLS) policies
- ✅ Sample data (4 produk sambel pecel)
- ✅ Database function untuk reporting

### 2. Setup Clerk Webhook

Agar profile user otomatis terbuat saat sign up, setup webhook:

1. **Di Clerk Dashboard**:
   - Buka **Webhooks**
   - Klik **Add Endpoint**
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: Pilih `user.created`, `user.updated`, `user.deleted`
   
2. **Copy Signing Secret**:
   - Setelah endpoint terbuat, copy signing secret
   - Tambahkan ke `.env.local`:
     ```env
     CLERK_SIGNING_SECRET=your_signing_secret_here
     ```

3. **Di Supabase**:
   - Buka **Authentication** → **Integrations**
   - Setup **Clerk** sebagai Third-Party Auth
   - Ikuti wizard yang tersedia

### 3. Verify Environment Variables

Pastikan `.env.local` sudah lengkap:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_SIGNING_SECRET=whsec_...  # Untuk webhook

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ADMIN ACCESS - JANGAN EXPOSE!
```

**CATATAN**: `SUPABASE_SERVICE_ROLE_KEY` bisa didapat dari:
- Supabase Dashboard → Project Settings → API
- Copy "service_role key" (bukan anon key!)

### 4. Test Local Development

```bash
npm run dev
```

Test flow:
1. Sign up akun baru di `/sign-up`
2. Webhook otomatis membuat profile di database
3. Redirect ke dashboard
4. Update role user di database jika perlu (admin/supervisor/sales)

## 📡 API Endpoints

Semua endpoint ada di `src/app/api/` dan memerlukan autentikasi Clerk.

### Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update current user profile

### Products
- `GET /api/products` - Get all active products
- `POST /api/products` - Create product (admin/supervisor only)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Shops (Toko)
- `GET /api/shops` - Get shops (sales: own only, supervisor: all team)
- `POST /api/shops` - Create new shop
- `PUT /api/shops/:id` - Update shop
- `DELETE /api/shops/:id` - Delete shop

### Transactions
- `GET /api/transactions?limit=50&month=4&year=2026` - Get transactions
- `POST /api/transactions` - Create transaction(s)
  ```json
  {
    "toko_id": "uuid",
    "product_id": "uuid",
    "quantity": 5,
    "total_harga": 75000
  }
  ```

### Daily Reports
- `GET /api/reports?limit=30` - Get reports
- `POST /api/reports` - Submit daily report
- `PUT /api/reports/:id` - Verify report (supervisor only)
  ```json
  {
    "status_hadir": "hadir",
    "supervisor_notes": "Good job!"
  }
  ```

### Visit Plans
- `GET /api/visits?date=2026-04-08` - Get visit plans
- `POST /api/visits` - Create visit plan(s)
- `PUT /api/visits/:id` - Update visit (mark completed)
  ```json
  {
    "is_completed": true
  }
  ```

### Dashboard Stats
- `GET /api/dashboard/stats?month=4&year=2026` - Get dashboard statistics
  Returns:
  ```json
  {
    "profile": {...},
    "totalSales": 5000000,
    "transactionCount": 25,
    "shopsVisited": 15,
    "attendanceDays": 7,
    "pendingReports": 2,
    "progress": 50,
    "penalty": 500000,
    "estimatedSalary": 1700000
  }
  ```

### Team Management
- `GET /api/team` - Get team members (supervisor/admin)
- `PUT /api/team/:id` - Update team member (salary, target, etc)
  ```json
  {
    "base_salary": 2500000,
    "monthly_target": 12000000
  }
  ```

### Verification
- `GET /api/verification/pending` - Get pending reports
- `POST /api/verification/:id` - Verify report
  ```json
  {
    "status_hadir": "hadir",
    "supervisor_notes": "Verified"
  }
  ```

### Webhooks
- `POST /api/webhooks/clerk` - Clerk webhook endpoint (internal)

## 🔐 Security

### Row Level Security (RLS)

Database sudah dilengkapi RLS policies:

**Profiles**:
- Semua user bisa view profiles
- User hanya bisa update profile sendiri
- Admin bisa insert/delete profiles

**Products**:
- Semua bisa view active products
- Admin/Supervisor bisa CRUD products

**Shops (Toko)**:
- Sales: CRUD shops sendiri
- Supervisor/Admin: View semua shops

**Transactions**:
- Sales: Create & view transactions sendiri
- Supervisor/Admin: View semua transactions

**Reports**:
- Sales: Create & view reports sendiri
- Supervisor: Update/verify reports

**Visit Plans**:
- Sales: CRUD visit plans sendiri

### API Role Checks

Semua API endpoint mengecek:
1. User authenticated via Clerk
2. Profile exists in database
3. Role has permission for action

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User data with role, salary, target |
| `products` | Product catalog |
| `toko` | Shop/customer data |
| `transaksi` | Sales transactions |
| `kunjungan` | Visit logs |
| `laporan_harian` | Daily attendance reports |
| `rencana_kunjungan` | Planned visits |

### Database Functions

`get_sales_monthly_summary(sales_id, month, year)`:
Returns aggregated stats for a sales person:
- total_sales
- transaction_count
- shops_visited
- attendance_days
- progress_percentage
- penalty_amount
- estimated_salary

## 🧪 Testing Backend

### 1. Test Webhook

Setelah signup user baru:
```bash
# Check if profile was created
# Di Supabase Dashboard → Table Editor → profiles
# Harusnya ada user baru dengan clerk_id yang sesuai
```

### 2. Test API dengan curl

```bash
# Login dulu di browser untuk get cookie

# Get profile
curl http://localhost:3000/api/profile

# Get products
curl http://localhost:3000/api/products

# Get shops
curl http://localhost:3000/api/shops
```

### 3. Test Database Function

Di Supabase SQL Editor:
```sql
-- Get sales_id dari table profiles
SELECT id FROM profiles WHERE role = 'sales' LIMIT 1;

-- Call function (ganti uuid dengan sales_id yang actual)
SELECT * FROM get_sales_monthly_summary(
  'sales-uuid-here',
  4,  -- month
  2026 -- year
);
```

## 📊 Role Permissions Summary

| Action | Sales | Supervisor | Admin |
|--------|-------|------------|-------|
| View own shops | ✅ | ✅ | ✅ |
| View all shops | ❌ | ✅ | ✅ |
| Create shops | ✅ | ❌ | ❌ |
| View own transactions | ✅ | ✅ | ✅ |
| Create transactions | ✅ | ❌ | ❌ |
| Submit daily report | ✅ | ❌ | ❌ |
| Verify reports | ❌ | ✅ | ✅ |
| View team performance | ❌ | ✅ | ✅ |
| Manage products | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Update salary/target | ❌ | ✅ | ✅ |

## 🐛 Troubleshooting

### "Profile not found"
- Pastikan webhook sudah dijalankan atau buat profile manual di Supabase
- Cek `clerk_id` di profiles table sesuai dengan user ID dari Clerk

### "Unauthorized"
- Pastikan user sudah login
- Cek cookie/header authentication

### "RLS policy violation"
- Cek RLS policies di Supabase
- Pastikan user punya role yang benar
- Verifikasi JWT token dari Clerk

### Webhook tidak jalan
- Cek `CLERK_SIGNING_SECRET` di .env.local
- Cek Clerk dashboard → webhook logs
- Pastikan endpoint URL benar

### Service role key error
- Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah benar
- Service role key beda dengan anon key
- Jangan expose service role key ke frontend!

## 📝 Database Management

### Backup Database
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Backup
supabase db dump -f backup.sql
```

### Reset Database (Development)
```sql
-- WARNING: Ini akan hapus semua data!
DROP TABLE IF EXISTS rencana_kunjungan CASCADE;
DROP TABLE IF EXISTS laporan_harian CASCADE;
DROP TABLE IF EXISTS kunjungan CASCADE;
DROP TABLE IF EXISTS transaksi CASCADE;
DROP TABLE IF EXISTS toko CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Lalu jalankan migration ulang
```

---

**Backend sudah siap! 🎉**

Selanjutnya:
1. ✅ Setup webhook di Clerk
2. ✅ Jalankan migration di Supabase
3. ✅ Test sign up & login
4. ✅ Mulai development fitur baru
