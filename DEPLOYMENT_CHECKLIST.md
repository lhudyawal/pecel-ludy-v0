# ✅ Deployment Checklist - Sambel Pecel Ludy

Gunakan checklist ini setiap kali akan deploy ke production.

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] Semua fitur berjalan baik di local
- [ ] `npm run build` berhasil tanpa error
- [ ] `npm run lint` tidak ada critical warnings
- [ ] `npx tsc --noEmit` tidak ada TypeScript errors
- [ ] Tidak ada `console.log` yang tidak perlu
- [ ] Code sudah direview (jika ada tim)

### Security
- [ ] `.env.local` **TIDAK** di-commit (sudah di `.gitignore`)
- [ ] Tidak ada hardcoded secrets di source code
- [ ] API keys tidak ter-expose di client-side code
- [ ] Semua sensitive data menggunakan environment variables

### Database
- [ ] Migration sudah dijalankan di Supabase
- [ ] Database schema sesuai dengan yang diharapkan
- [ ] RLS policies sudah dikonfigurasi
- [ ] Sample/seed data sudah ada (jika perlu)
- [ ] Database backup terbaru sudah ada

### Authentication (Clerk)
- [ ] Webhook endpoint sudah dikonfigurasi
- [ ] Webhook URL mengarah ke production URL
- [ ] Signing secret sudah diset di environment variables
- [ ] Redirect URLs sudah benar:
  - Sign In: `/sign-in`
  - Sign Up: `/sign-up`
  - After Sign In: `/dashboard`
  - After Sign Up: `/dashboard`

### Documentation
- [ ] README.md sudah update
- [ ] CHANGELOG.md sudah update (jika ada)
- [ ] API documentation sudah update
- [ ] Environment variables baru sudah didokumentasikan

### Git
- [ ] Semua file penting sudah di-stage
- [ ] Commit message jelas dan deskriptif
- [ ] Branch sudah up-to-date dengan main
- [ ] Tidak ada merge conflicts

---

## 🚀 Deployment Steps

### Step 1: Commit & Push

```bash
# Cek status
git status

# Review changes
git diff HEAD

# Stage files
git add .

# Commit
git commit -m "feat: description of changes"

# Push
git push origin main
```

- [ ] Code sudah di-push ke GitHub
- [ ] GitHub Actions CI/CD pipeline passed

### Step 2: Deploy ke Platform

#### Untuk Vercel:
- [ ] Environment variables sudah update di Vercel
- [ ] Deploy otomatis berjalan (atau manual trigger)
- [ ] Build berhasil
- [ ] Deploy berhasil

#### Untuk Railway:
- [ ] Environment variables sudah update
- [ ] Deploy otomatis berjalan
- [ ] Build dan deploy berhasil

### Step 3: Post-Deployment Verification

#### Basic Checks
- [ ] Aplikasi bisa diakses
- [ ] Homepage loading dengan benar
- [ ] No 500 errors di browser console
- [ ] SSL certificate valid (https)

#### Authentication
- [ ] Sign Up berfungsi
- [ ] Sign In berfungsi
- [ ] Sign Out berfungsi
- [ ] Redirect setelah login benar
- [ ] Profile user terbuat di database

#### Database
- [ ] Koneksi ke Supabase berhasil
- [ ] Data bisa di-fetch
- [ ] Data bisa di-insert/update/delete
- [ ] RLS policies bekerja

#### Core Features
- [ ] Dashboard loading sesuai role
- [ ] API routes berfungsi
- [ ] Forms submit dengan benar
- [ ] Data display dengan benar

#### Role-Based Access
- [ ] Admin bisa akses semua fitur
- [ ] Supervisor bisa akses fitur supervisor
- [ ] Sales bisa akses fitur sales
- [ ] Unauthorized access diblock

### Step 4: Monitoring Setup

- [ ] Analytics tracking aktif
- [ ] Error tracking aktif (jika ada)
- [ ] Logs bisa diakses
- [ ] Alerts dikonfigurasi (jika perlu)

---

## 🔧 Environment Variables Checklist

Pastikan semua variables ini sudah diset di hosting platform:

### Clerk
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (production key)
- [ ] `CLERK_SECRET_KEY` (production key, encrypted)
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- [ ] `CLERK_SIGNING_SECRET` (encrypted)

### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (production URL)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (encrypted, JANGAN expose ke client!)

---

## 🧪 Testing Checklist

### Manual Testing

#### Authentication Flow
- [ ] User baru bisa sign up
- [ ] User bisa sign in
- [ ] User bisa sign out
- [ ] Protected routes redirect ke sign-in jika belum login
- [ ] Setelah login, redirect ke dashboard

#### Admin Features
- [ ] Bisa lihat semua users
- [ ] Bisa create/update/delete users
- [ ] Bisa set roles (admin/supervisor/sales)
- [ ] Bisa manage products
- [ ] Bisa lihat semua data
- [ ] Analytics dashboard berfungsi

#### Supervisor Features
- [ ] Bisa lihat team members
- [ ] Bisa verify daily reports
- [ ] Bisa lihat team performance
- [ ] Bisa manage products
- [ ] Tidak bisa manage users

#### Sales Features
- [ ] Bisa manage shops (CRUD)
- [ ] Bisa create transactions
- [ ] Bisa submit daily reports
- [ ] Bisa plan visits
- [ ] Bisa lihat salary & target
- [ ] Hanya bisa lihat data sendiri

#### API Endpoints
- [ ] `/api/profile` - GET, PUT
- [ ] `/api/products` - GET, POST, PUT, DELETE
- [ ] `/api/shops` - GET, POST, PUT, DELETE
- [ ] `/api/transactions` - GET, POST
- [ ] `/api/reports` - GET, POST, PUT
- [ ] `/api/visits` - GET, POST, PUT
- [ ] `/api/team` - GET, POST, PUT, DELETE
- [ ] `/api/dashboard/stats` - GET
- [ ] `/api/verification/*` - GET, POST

#### UI/UX
- [ ] Dark mode toggle berfungsi
- [ ] Mobile responsive
- [ ] Navigation/sidebar berfungsi
- [ ] Forms validation bekerja
- [ ] Error messages muncul dengan benar
- [ ] Loading states ada
- [ ] Toast notifications berfungsi

---

## 🚨 Rollback Plan

Jika deployment gagal:

### Quick Rollback
```bash
# Cek commit sebelumnya
git log --oneline -5

# Revert ke commit sebelumnya
git revert HEAD

# Push revert
git push origin main
```

### Atau Deploy Versi Sebelumnya
- Vercel: Dashboard → Deployments → Pilih versi sebelumnya → Promote to Production
- Railway: Dashboard → Deployments → Rollback ke versi sebelumnya

---

## 📝 Post-Deployment Tasks

Setelah berhasil deploy:

- [ ] Test semua fitur di production
- [ ] Monitor logs untuk errors (24 jam pertama)
- [ ] Setup database automated backup
- [ ] Update dokumentasi jika ada perubahan
- [ ] Notify team members tentang deployment
- [ ] Monitor performance metrics
- [ ] Check user feedback

---

## 🔄 Regular Maintenance

### Weekly
- [ ] Check error logs
- [ ] Monitor database performance
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies (`npm update`)
- [ ] Rotate secrets (Clerk, Supabase keys)
- [ ] Review dan cleanup old data
- [ ] Database backup manual

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Feature review dan planning
- [ ] Documentation review dan update

---

## 📞 Emergency Contacts

Jika ada masalah saat atau setelah deployment:

1. **Check Logs**: Platform hosting → Logs
2. **Check Documentation**: `PROJECT_DOCUMENTATION.md`, `BACKEND_SETUP.md`
3. **Check Database**: Supabase Dashboard → Logs
4. **Check Auth**: Clerk Dashboard → Users & Webhooks
5. **Contact Team**: Notify developer team jika ada critical issues

---

**Last Updated**: April 10, 2026
**Version**: 1.0.0
