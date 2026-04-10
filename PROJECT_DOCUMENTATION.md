# 🌶️ SAMBEL PECEL LUDY - Project Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Setup & Installation](#setup--installation)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [User Roles & Permissions](#user-roles--permissions)
7. [API Endpoints](#api-endpoints)
8. [Dashboard Features](#dashboard-features)
9. [Development Guide](#development-guide)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Overview

**Sambel Pecel Ludy** is a comprehensive sales management system for a sambal pecel business. The application enables sales teams to manage customer relationships, track transactions, plan visits, and generate daily reports, while supervisors can verify activities and monitor team performance.

### Key Features:
- ✅ **CRM Toko** - Customer/shop relationship management
- ✅ **Sales Tracking** - Transaction recording and monitoring
- ✅ **Visit Planning** - Plan and track customer visits
- ✅ **Daily Reports** - Sales attendance and activity reporting
- ✅ **Salary & Target Management** - Automated salary calculation with penalties
- ✅ **Verification System** - Supervisor verification workflow
- ✅ **Performance Analytics** - Team and individual performance dashboards
- ✅ **Role-Based Access Control** - Admin, Supervisor, and Sales roles

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Component library
- **Lucide React** - Icon library
- **next-themes** - Dark/light mode support

### Backend & Database
- **Supabase** - PostgreSQL database with Row Level Security
- **Supabase JS Client** - Database client library

### Authentication
- **Clerk** - User authentication and management
- **Clerk Next.js SDK** - Next.js integration
- **Svix** - Webhook verification

### Utilities
- **Zod** - Schema validation
- **date-fns** - Date manipulation
- **Recharts** - Data visualization

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project
- Clerk account and project

### 1. Clone & Install
```bash
cd /path/to/pecel-ludy-v0
npm install
```

### 2. Environment Variables
Create `.env.local` file:

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

### 3. Database Setup
1. Open Supabase Dashboard → SQL Editor
2. Run migration: `supabase/migrations/002_sambel_pecel_ludy_schema.sql`
3. This creates 7 tables with RLS policies and sample data

### 4. Clerk Webhook Setup
1. Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://your-domain.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy Signing Secret to `.env.local`

### 5. Development Server
```bash
npm run dev
```
Access at: http://localhost:3001

---

## 🗄️ Database Schema

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User data and roles | clerk_id, role, base_salary, monthly_target |
| `products` | Product catalog | name, size, price, stock |
| `toko` | Customer/shop data | sales_id, location details |
| `transaksi` | Sales transactions | toko_id, product_id, quantity |
| `kunjungan` | Visit logs | toko_id, sales_id, notes |
| `laporan_harian` | Daily attendance | sales_id, date, status |
| `rencana_kunjungan` | Planned visits | toko_id, sales_id, date |

### Key Relationships
```
profiles (1) ←→ (N) toko
profiles (1) ←→ (N) transaksi
profiles (1) ←→ (N) kunjungan
profiles (1) ←→ (N) laporan_harian
toko (1) ←→ (N) transaksi
toko (1) ←→ (N) kunjungan
products (1) ←→ (N) transaksi
```

---

## 🔐 Authentication Flow

### Login Flow
1. User accesses `/sign-in`
2. Authenticates via Clerk (Google OAuth or email/password)
3. Clerk redirects to `/dashboard`
4. Dashboard checks for profile in Supabase
5. If profile missing → auto-create via webhook or manual creation
6. User sees role-based dashboard

### Protected Routes
- `/sign-in`, `/sign-up` → Public (no auth required)
- `/dashboard` and all sub-routes → Protected (requires authentication)
- Middleware (`src/middleware.ts`) enforces protection
- Clerk handles redirects for unauthenticated users

### User Sync Methods

**Method 1: Webhook Auto-Sync** (Recommended for production)
- Clerk webhook triggers on user creation
- Creates/updates profile in Supabase automatically

**Method 2: Manual Sync Script** (For development)
```bash
node scripts/sync-clerk-user.js  # Clerk → Supabase
node scripts/sync-users-to-clerk.js  # Supabase → Clerk
```

**Method 3: User Self-Registration**
- Users sign up at `/sign-up`
- Webhook creates profile in Supabase
- Admin assigns role via dashboard

---

## 👥 User Roles & Permissions

### Role Hierarchy
```
Admin
  ↓ manages
Supervisor
  ↓ manages
Sales
```

### Permissions Matrix

| Action | Admin | Supervisor | Sales |
|--------|-------|------------|-------|
| Manage users | ✅ | ❌ |  |
| View all teams | ✅ | ✅ (own team) | ❌ |
| Manage products | ✅ | ✅ | ❌ |
| Create shops | ✅ | ❌ | ✅ (own) |
| View all shops | ✅ | ✅ | ❌ (own only) |
| Create transactions | ❌ | ❌ | ✅ (own) |
| Submit daily reports | ❌ | ❌ | ✅ |
| Verify reports | ✅ | ✅ | ❌ |
| View team performance | ✅ | ✅ | ❌ (own only) |
| Set salary/targets | ✅ | ✅ | ❌ |

### Role-Specific Dashboards
- **Admin**: User management, products, analytics
- **Supervisor**: Team oversight, verification, performance
- **Sales**: CRM, transactions, visits, reports, salary

---

## 🔌 API Endpoints

### Authentication
All endpoints require Clerk authentication via middleware.

### Profile
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/profile` | Get current user profile | All |
| PUT | `/api/profile` | Update own profile | All |

### Users/Team
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/team` | Get team members | Admin, Supervisor |
| POST | `/api/team` | Create user | Admin only |
| PUT | `/api/team/:id` | Update user | Admin only |
| DELETE | `/api/team/:id` | Delete user | Admin only |

### Products
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/products` | Get all products | All (admin sees all, others see active) |
| POST | `/api/products` | Create product | Admin, Supervisor |
| PUT | `/api/products/:id` | Update product | Admin, Supervisor |
| DELETE | `/api/products/:id` | Delete product | Admin, Supervisor |

### Shops (Toko)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/shops` | Get shops | Sales (own), Supervisor/Admin (all) |
| POST | `/api/shops` | Create shop | Sales |
| PUT | `/api/shops/:id` | Update shop | Sales |
| DELETE | `/api/shops/:id` | Delete shop | Sales |

### Transactions
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/transactions` | Get transactions | Sales (own), Supervisor/Admin (all) |
| POST | `/api/transactions` | Create transaction(s) | Sales |

### Daily Reports
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/reports` | Get reports | Sales (own), Supervisor (team) |
| POST | `/api/reports` | Submit daily report | Sales |
| PUT | `/api/reports/:id` | Verify report | Supervisor, Admin |

### Visit Plans
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/visits` | Get visit plans | Sales |
| POST | `/api/visits` | Create visit plan | Sales |
| PUT | `/api/visits/:id` | Mark visit complete | Sales |

### Dashboard Stats
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard/stats` | Get dashboard statistics | All (role-based data) |

### Verification
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/verification/pending` | Get pending reports | Supervisor, Admin |
| POST | `/api/verification/:id` | Verify report | Supervisor, Admin |

---

## 📊 Dashboard Features

### Admin Dashboard (`/dashboard`)
- **User Management** (`/dashboard/team`)
  - CRUD operations for all users
  - Assign roles (admin, supervisor, sales)
  - Set salary and monthly targets
  - Assign supervisors to sales users

- **Product Management** (`/dashboard/products`)
  - Add/edit/delete products
  - Manage pricing and stock
  - Toggle active/inactive status

- **Analytics** (`/dashboard/analytics`)
  - System overview
  - User statistics
  - Product counts
  - System health

### Supervisor Dashboard
- **Team Management** (`/dashboard/team`)
  - View team members
  - Monitor team performance

- **Verification** (`/dashboard/verification`)
  - Review pending daily reports
  - Approve/reject reports
  - Add supervisor notes

- **Performance** (`/dashboard/performance`)
  - Team performance metrics
  - Sales progress tracking
  - Attendance overview

### Sales Dashboard
- **CRM Toko** (`/dashboard/shops`)
  - Manage customer shops
  - View shop details and history
  - Add new shops

- **Visit Plans** (`/dashboard/visits`)
  - Plan daily visits
  - Track completed visits
  - Print visit schedule

- **Transactions** (`/dashboard/transactions`)
  - Record sales
  - View transaction history
  - Manage products sold

- **Daily Reports** (`/dashboard/daily-report`)
  - Submit attendance
  - Report daily activities
  - View report status

- **Salary & Target** (`/dashboard/salary`)
  - View current progress
  - Track penalty calculations
  - See estimated salary

---

## 💻 Development Guide

### Project Structure
```
pecel-ludy-v0/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── sign-in/          # Auth pages
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── dashboard-layout.tsx
│   │   └── *-dashboard.tsx
│   ├── lib/
│   │   └── supabase.ts      # Supabase client
│   ├── middleware.ts         # Clerk middleware
│   └── hooks/               # Custom hooks
├── scripts/                  # Utility scripts
├── supabase/
│   └── migrations/          # Database migrations
└── .env.local               # Environment variables
```

### Key Files

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Route protection with Clerk |
| `src/app/layout.tsx` | Root layout with ClerkProvider |
| `src/lib/supabase.ts` | Supabase client configuration |
| `src/components/dashboard-layout.tsx` | Shared dashboard layout with sidebar |
| `src/app/dashboard/page.tsx` | Main dashboard router |

### Styling
- Tailwind CSS with CSS variables for theming
- Dark mode support via `next-themes`
- Component classes: `bg-background`, `text-foreground`, `border-border`, etc.

### Database Queries
- Server components: Use `createSupabaseServerClient()` with service role key
- Client components: Use `createClient()` with anon key + Clerk token
- RLS is disabled for development (enable for production)

### Helper Scripts

| Script | Purpose |
|--------|---------|
| `scripts/test-supabase.js` | Test database connection |
| `scripts/sync-clerk-user.js` | Sync Clerk users to Supabase |
| `scripts/sync-users-to-clerk.js` | Sync Supabase users to Clerk |
| `setup-check.sh` | Verify setup completeness |

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Redirect Loop on Sign-In
**Problem**: Infinite redirect between `/sign-in` and `/dashboard`
**Solution**: 
- Check middleware configuration
- Ensure `/sign-in` is in public routes
- Verify user has profile in Supabase

#### 2. Profile Not Found Error
**Problem**: "We couldn't automatically create your profile"
**Solution**:
```bash
# Run sync script
node scripts/sync-clerk-user.js

# Or check database manually
node scripts/test-supabase.js
```

#### 3. 401 Unauthorized on API Routes
**Problem**: API calls return 401 error
**Solution**:
- Ensure user is authenticated via Clerk
- Check middleware is protecting routes correctly
- Verify Clerk session is active

#### 4. Sidebar Missing on Dashboard Pages
**Problem**: Navigation sidebar disappears on child pages
**Solution**: Ensure page is wrapped with `<DashboardLayout>` component
```tsx
<DashboardLayout user={user}>
  <YourPageContent />
</DashboardLayout>
```

#### 5. Theme Toggle Not Working
**Problem**: Dark/light mode doesn't switch
**Solution**:
- Verify `ThemeProvider` in root layout
- Check CSS variables are defined for `.dark` class
- Ensure components use theme-aware classes

#### 6. Database Connection Issues
**Problem**: Cannot connect to Supabase
**Solution**:
```bash
# Test connection
node scripts/test-supabase.js

# Check .env.local variables
# Verify Supabase project is active
# Ensure RLS policies are configured
```

#### 7. Webhook Not Creating Profiles
**Problem**: New Clerk users don't appear in Supabase
**Solution**:
- Verify webhook URL is correct
- Check `CLERK_SIGNING_SECRET` in .env.local
- Review webhook logs in Clerk Dashboard
- Use manual sync as fallback: `node scripts/sync-clerk-user.js`

### Quick Fixes

```bash
# Clean and restart
rm -rf .next
npm run dev

# Test database
node scripts/test-supabase.js

# Sync users
node scripts/sync-clerk-user.js

# Check environment
cat .env.local
```

---

## 📝 Additional Resources

### Documentation Files
- `README.md` - Project overview
- `BACKEND_SETUP.md` - Backend setup guide
- `QUICK_SETUP.md` - Quick start guide
- `SETUP_CARD.md` - Setup checklist
- `ROUTES_COMPLETE.md` - Route documentation
- `FIX_401_ERROR.md` - 401 error solutions
- `URGENT_SETUP.md` - Critical setup steps

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review documentation files in project root
3. Check browser console and server logs
4. Verify environment variables are set correctly
5. Test database connection with helper scripts

---

**Last Updated**: April 8, 2026
**Version**: 1.0.0
