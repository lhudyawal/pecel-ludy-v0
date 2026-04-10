# 🚨 PENTING: Setup Database Supabase

Anda melihat halaman "Setup Required" karena **database migration belum dijalankan**.

## ✅ Langkah Setup (WAJIB):

### 1. Buka Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select project: **mwkaqdagvesqzszkuwgk**
3. Click **"SQL Editor"** di sidebar kiri

### 2. Jalankan Database Migration

1. Copy **SELURUH** isi file: `supabase/migrations/002_sambel_pecel_ludy_schema.sql`
2. Paste di SQL Editor
3. Klik **"Run"** atau tekan `Cmd/Ctrl + Enter`

Migration ini akan membuat:
- ✅ 7 tabel (profiles, products, toko, transaksi, kunjungan, laporan_harian, rencana_kunjungan)
- ✅ Indexes untuk performa
- ✅ Row Level Security (RLS) policies
- ✅ Sample data (4 produk sambel pecel)
- ✅ Database functions untuk reporting

### 3. Setup Clerk Webhook

1. **Di Clerk Dashboard**:
   - Go to: https://dashboard.clerk.com
   - Select your application
   - Click **"Webhooks"** di sidebar
   - Click **"Add Endpoint"**
   
2. **Configure webhook**:
   - **Endpoint URL**: `http://localhost:3001/api/webhooks/clerk` (for local dev)
   - **Events to send**: Check ALL of these:
     - ☑️ `user.created`
     - ☑️ `user.updated`
     - ☑️ `user.deleted`
   
3. **Copy Signing Secret**:
   - Setelah endpoint terbuat, akan muncul **"Signing Secret"**
   - Click **"Reveal"** atau **"Copy"**
   - Update di `.env.local`:
     ```env
     CLERK_SIGNING_SECRET=whsec_your_actual_secret_here
     ```

### 4. Restart Development Server

Setelah migration dan webhook setup selesai:

```bash
# Stop server (Ctrl+C)
# Start lagi:
npm run dev
```

### 5. Test

1. Go to: http://localhost:3001
2. Sign up atau sign in
3. Webhook akan otomatis create profile di database
4. Anda akan diarahkan ke dashboard ✅

## ❓ Troubleshooting

### "Table 'profiles' does not exist"
→ Anda belum run migration di Supabase SQL Editor

### "Profile not created after signup"
→ Webhook belum disetup atau `CLERK_SIGNING_SECRET` salah

### "Still seeing 'Setup Required' page"
→ Restart server setelah setup selesai

## 📞 Butuh Bantuan?

Jika masih ada masalah:
1. Check browser console untuk error messages
2. Check terminal untuk server logs
3. Check Supabase logs di dashboard

---

**Jangan skip langkah di atas!** Database migration dan webhook setup adalah **WAJIB** agar aplikasi berfungsi dengan benar.
