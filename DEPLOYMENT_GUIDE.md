# 🚀 Panduan Deploy ke GitHub

Panduan lengkap untuk mendeploy aplikasi Sambel Pecel Ludy ke GitHub, dari commit pertama hingga production-ready.

---

## 📋 Daftar Isi
1. [Persiapan Awal](#persiapan-awal)
2. [Commit & Push ke GitHub](#commit--push-ke-github)
3. [Deploy ke Platform Hosting](#deploy-ke-platform-hosting)
4. [Setup Environment Variables di Production](#setup-environment-variables-di-production)
5. [Setup CI/CD (Opsional)](#setup-cicd-opsional)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 1. Persiapan Awal

### ✅ Checklist Sebelum Deploy

Sebelum melakukan deploy, pastikan hal-hal berikut:

#### A. Kode Sudah Siap
- [ ] Semua fitur sudah berjalan baik di local
- [ ] Tidak ada console.log yang tidak diperlukan
- [ ] Sudah menjalankan `npm run build` dan tidak ada error
- [ ] Sudah menjalankan `npm run lint` dan tidak ada warning

```bash
# Test build lokal
npm run build

# Test linting
npm run lint
```

#### B. File Sensitif Sudah di-ignore
File `.gitignore` sudah mencakup:
- `.env*` files (environment variables dengan secrets)
- `node_modules/` (dependencies)
- `.next/` (build output)
- `.DS_Store` (macOS files)

✅ **File `.gitignore` sudah aman** - jangan commit `.env.local`!

#### C. Dokumentasi Lengkap
- [x] `README.md` - Project overview
- [x] `PROJECT_DOCUMENTATION.md` - Dokumentasi lengkap
- [x] `BACKEND_SETUP.md` - Backend setup guide
- [x] `BACKEND_COMPLETE.md` - Backend implementation details

#### D. Database Migration Siap
- [ ] File migration: `supabase/migrations/002_sambel_pecel_ludy_schema.sql`
- [ ] Sample data sudah disiapkan
- [ ] RLS policies sudah dikonfigurasi

---

## 2. Commit & Push ke GitHub

### Langkah 1: Review Perubahan

```bash
# Lihat status file yang berubah
git status

# Lihat diff detail
git diff HEAD
```

**Saat ini ada perubahan:**
- **Modified files**: 8 file yang sudah diubah
- **Untracked files**: ~30+ file baru (API routes, dashboard pages, scripts, dll)

### Langkah 2: Tambahkan File ke Staging

```bash
# Tambahkan semua file (kecuali yang ada di .gitignore)
git add .

# ATAU tambahkan file per file untuk review
git add src/app/api/
git add src/app/dashboard/
git add src/components/
git add src/lib/
git add scripts/
git add supabase/
git add *.md
```

### Langkah 3: Commit Perubahan

```bash
# Commit dengan message yang deskriptif
git commit -m "feat: implement Sambel Pecel Ludy sales management system

- Add complete authentication with Clerk
- Implement role-based dashboards (Admin, Supervisor, Sales)
- Add API routes for products, shops, transactions, reports, visits
- Setup Supabase database schema with RLS policies
- Add Clerk webhook integration for user sync
- Add documentation and setup guides"
```

**Tips Commit Message:**
- Gunakan prefix: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Jelaskan APA yang berubah dan MENGAPA
- Untuk perubahan besar, gunakan multi-line commit message

### Langkah 4: Push ke GitHub

```bash
# Push ke branch main (jika belum ada remote)
git push -u origin main

# ATAU jika sudah ada remote tracking
git push
```

### Langkah 5: Verifikasi di GitHub

1. Buka repository: https://github.com/lhudyawal/pecel-ludy-v0
2. Cek bahwa semua file sudah ter-upload
3. Cek bahwa `.env.local` **TIDAK** ter-commit (harusnya ada di `.gitignore`)
4. Review README.md di GitHub untuk memastikan formatting benar

---

## 3. Deploy ke Platform Hosting

### Opsi A: Deploy ke Vercel (Recommended) ⭐

Vercel adalah platform terbaik untuk Next.js apps dengan setup yang sangat mudah.

#### Langkah Deploy:

1. **Buat Akun di Vercel**
   - Buka https://vercel.com
   - Sign up dengan GitHub account
   - Authorize Vercel untuk akses repository

2. **Import Repository**
   - Klik "New Project"
   - Pilih repository `pecel-ludy-v0`
   - Klik "Import"

3. **Konfigurasi Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (root)
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)

4. **Setup Environment Variables**
   
   Tambahkan semua variables ini di Vercel Dashboard → Settings → Environment Variables:

   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   CLERK_SIGNING_SECRET=whsec_...

   # Supabase Database
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   **PENTING**: 
   - Pilih environment: **Production** (dan **Preview** jika perlu)
   - Jangan centang "Encrypt" untuk `NEXT_PUBLIC_*` variables
   - Centang "Encrypt" untuk `CLERK_SECRET_KEY` dan `SUPABASE_SERVICE_ROLE_KEY`

5. **Deploy!**
   - Klik "Deploy"
   - Tunggu build selesai (~2-5 menit)
   - Aplikasi akan tersedia di: `https://pecel-ludy-v0.vercel.app`

6. **Setup Custom Domain (Opsional)**
   - Vercel Dashboard → Settings → Domains
   - Tambahkan domain custom (misal: `app.pecelludy.com`)
   - Update DNS records sesuai instruksi

#### Auto Deploy on Push

Setelah setup awal, setiap kali Anda push ke GitHub:
- Push ke `main` → Auto deploy ke **Production**
- Push ke branch lain → Auto deploy ke **Preview** (URL unik)

---

### Opsi B: Deploy ke Railway

Railway adalah alternatif yang bagus dengan database PostgreSQL built-in.

#### Langkah Deploy:

1. **Buat Akun di Railway**
   - Buka https://railway.app
   - Sign in dengan GitHub

2. **New Project from GitHub**
   - Klik "New Project"
   - Pilih "Deploy from GitHub repo"
   - Pilih `pecel-ludy-v0`

3. **Setup Environment Variables**
   - Project → Variables
   - Tambahkan semua variables yang sama seperti di Vercel

4. **Deploy**
   - Railway auto-detect Next.js dan build otomatis
   - Aplikasi tersedia di: `https://pecel-ludy-v0.railway.app`

---

### Opsi C: Deploy ke Netlify

Netlify juga mendukung Next.js dengan beberapa fitur khusus.

#### Langkah Deploy:

1. **Buat Akun di Netlify**
   - Buka https://netlify.com
   - Sign up dengan GitHub

2. **Import Repository**
   - "Add new site" → "Import an existing project"
   - Connect ke GitHub
   - Pilih `pecel-ludy-v0`

3. **Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

4. **Environment Variables**
   - Site settings → Environment variables
   - Tambahkan semua variables yang diperlukan

5. **Deploy**

---

### Opsi D: Deploy ke AWS/GCP/Azure (Advanced)

Untuk enterprise deployment:

#### AWS (Amazon Web Services)
- **AWS Amplify**: Easy Next.js deployment
- **ECS/EKS**: Docker container deployment
- **Lambda + API Gateway**: Serverless architecture

#### GCP (Google Cloud Platform)
- **Cloud Run**: Container-based deployment
- **App Engine**: Managed platform deployment

#### Azure
- **Azure Static Web Apps**: Next.js optimized
- **Azure App Service**: Traditional web app hosting

---

## 4. Setup Environment Variables di Production

### 🔐 Security Best Practices

#### DO's ✅
- ✅ Gunakan environment variables untuk semua secrets
- ✅ Encrypt sensitive variables di platform hosting
- ✅ Gunakan different keys untuk production vs development
- ✅ Rotate secrets secara berkala
- ✅ Gunakan `.env.example` untuk dokumentasi variables

#### DON'Ts ❌
- ❌ JANGAN pernah commit `.env.local` ke GitHub
- ❌ JANGAN hardcode secrets di source code
- ❌ JANGAN share API keys di client-side code
- ❌ JANGAN gunakan production keys di development

### Setup di Berbagai Platform

#### Vercel
```
Settings → Environment Variables → Add Variable
```
- Pilih environment (Production/Preview/Development)
- Encrypt jika sensitive

#### Railway
```
Project → Variables → New Variable
```

#### Netlify
```
Site Settings → Build & Deploy → Environment
```

### Production vs Development Keys

| Variable | Development | Production |
|----------|-------------|------------|
| Clerk Keys | `pk_test_...` | `pk_live_...` |
| Supabase URL | `https://dev.supabase.co` | `https://prod.supabase.co` |
| Webhook Secret | `whsec_test_...` | `whsec_live_...` |

**Rekomendasi**: Buat project terpisah di Clerk & Supabase untuk production!

---

## 5. Setup CI/CD (Opsional)

### GitHub Actions untuk Automated Testing

Buat file `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Lint code
      run: npm run lint

    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
        CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

    - name: Upload build artifacts
      if: success()
      uses: actions/upload-artifact@v3
      with:
        name: build-output
        path: .next/
```

### Setup GitHub Secrets

1. Repository → Settings → Secrets and variables → Actions
2. Tambahkan secrets:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 6. Monitoring & Maintenance

### Post-Deployment Checklist

Setelah deploy, verifikasi:

- [ ] Aplikasi bisa diakses di URL production
- [ ] Login/Register berfungsi dengan Clerk
- [ ] Database connection ke Supabase berhasil
- [ ] Dashboard muncul dengan data yang benar
- [ ] API routes bekerja dengan baik
- [ ] Webhook Clerk menerima events
- [ ] Dark mode toggle berfungsi
- [ ] Mobile responsive
- [ ] No console errors di browser

### Monitoring Tools

#### Vercel Analytics
- Dashboard → Analytics
- Track page views, performance, errors

#### Sentry (Error Tracking)
```bash
npm install @sentry/nextjs
```

Setup di `sentry.client.config.ts` dan `sentry.server.config.ts`

#### Log Management
- **Vercel**: Dashboard → Logs
- **Railway**: Dashboard → Deployments → Logs
- **Custom**: Integrate dengan LogDNA, Datadog

### Database Backup

#### Manual Backup (Supabase)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Backup database
supabase db dump -f backup.sql --project-ref your-project-ref
```

#### Automated Backup
- Supabase: Settings → Database → Backups (auto daily)
- Export secara berkala untuk safety

### Update & Maintenance

#### Update Aplikasi
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Test locally
npm run dev

# Build & push
npm run build
git add .
git commit -m "update: description of changes"
git push origin main
```

#### Update Database Schema
1. Buat migration baru: `supabase/migrations/003_new_feature.sql`
2. Run di Supabase SQL Editor
3. Commit migration file

#### Monitoring Clerk Webhooks
- Clerk Dashboard → Webhooks → Logs
- Pastikan webhook events diterima dengan sukses
- Check untuk errors atau failed deliveries

---

## 🚨 Troubleshooting Deployment

### 1. Build Gagal di Vercel

**Problem**: Build error saat deploy
**Solution**:
```bash
# Test build lokal terlebih dahulu
npm run build

# Cek error messages
# Biasanya karena:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies
```

**Fix**:
- Tambahkan semua environment variables di Vercel
- Fix TypeScript errors sebelum push
- Pastikan semua dependencies ada di `package.json`

### 2. Application Error saat Runtime

**Problem**: 500 Internal Server Error
**Solution**:
- Check logs di platform hosting
- Verify database connection (Supabase URL & keys)
- Check Clerk authentication setup
- Ensure webhook URL benar di Clerk dashboard

### 3. Database Connection Timeout

**Problem**: Cannot connect to Supabase
**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` benar
- Check network/firewall settings
- Ensure Supabase project is active
- Test connection dengan curl:
  ```bash
  curl https://your-project.supabase.co/rest/v1/ \
    -H "apikey: your-anon-key"
  ```

### 4. Authentication Not Working

**Problem**: Login tidak berhasil di production
**Solution**:
- Update Clerk redirect URLs di dashboard:
  - Site URL: `https://your-domain.com`
  - Redirect URL: `https://your-domain.com/dashboard`
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` adalah production key
- Check browser console untuk CORS errors

### 5. Webhook Tidak Jalan

**Problem**: User baru tidak terbuat di Supabase
**Solution**:
- Update webhook URL di Clerk: `https://your-domain.com/api/webhooks/clerk`
- Verify `CLERK_SIGNING_SECRET` benar
- Check webhook logs di Clerk Dashboard
- Test dengan trigger event manual

---

## 📚 Resources

### Dokumentasi Internal
- `README.md` - Project overview
- `PROJECT_DOCUMENTATION.md` - Complete documentation
- `BACKEND_SETUP.md` - Backend setup guide
- `QUICK_SETUP.md` - Quick start guide

### Dokumentasi Eksternal
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Clerk Deployment](https://clerk.com/docs/deployments/overview)
- [Supabase Deployment](https://supabase.com/docs/guides/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🎯 Quick Reference Commands

```bash
# Development
npm run dev              # Start development server

# Testing
npm run build            # Build for production
npm run lint             # Run linter
npm start                # Start production server

# Git Operations
git status               # Check status
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push origin main     # Push to GitHub

# Database
# Run migrations di Supabase SQL Editor
# File: supabase/migrations/002_sambel_pecel_ludy_schema.sql
```

---

## ✅ Deployment Checklist Final

Sebelum deploy ke production:

- [ ] Semua code sudah di-commit dan push
- [ ] `.env.local` **TIDAK** ter-commit
- [ ] `npm run build` sukses tanpa error
- [ ] `npm run lint` tidak ada critical warnings
- [ ] Database migration sudah dijalankan di Supabase
- [ ] Clerk webhook sudah dikonfigurasi
- [ ] Environment variables sudah diset di hosting platform
- [ ] Testing di local sudah lengkap
- [ ] README dan dokumentasi sudah update
- [ ] Production keys (bukan test keys) digunakan

---

**Happy Deploying! 🚀**

Setelah deploy, jangan lupa untuk:
1. Test semua fitur di production
2. Monitor logs untuk errors
3. Setup monitoring & alerts
4. Backup database secara berkala
5. Update dependencies secara rutin

Jika ada pertanyaan atau issue, check dokumentasi atau hubungi tim development.
