#!/bin/bash

# SAMBEL PECEL LUDY - Setup Helper Script
# Run this script to verify your setup

echo "🌶️  SAMBEL PECEL LUDY - Setup Verification"
echo "============================================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ .env.local found"
    
    # Check for required variables
    if grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env.local; then
        echo "✅ Clerk Publishable Key configured"
    else
        echo "❌ Clerk PublishableKey missing"
    fi
    
    if grep -q "CLERK_SECRET_KEY" .env.local; then
        echo "✅ Clerk Secret Key configured"
    else
        echo "❌ Clerk Secret Key missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ Supabase URL configured"
    else
        echo "❌ Supabase URL missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ Supabase Anon Key configured"
    else
        echo "❌ Supabase Anon Key missing"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "✅ Supabase Service Role Key configured"
    else
        echo "⚠️  Supabase Service Role Key missing (needed for webhooks)"
    fi
    
    if grep -q "CLERK_SIGNING_SECRET" .env.local; then
        echo "✅ Clerk Signing Secret configured"
    else
        echo "⚠️  Clerk Signing Secret missing (needed for webhooks)"
    fi
else
    echo "❌ .env.local not found. Please create it from .env.local.example"
fi

echo ""
echo "📦 Checking dependencies..."

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "❌ node_modules not found. Run: npm install"
fi

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found"
fi

echo ""
echo "🗄️  Checking database migrations..."

# Check migration files
if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    echo "✅ Found $MIGRATION_COUNT migration file(s)"
    
    if [ -f "supabase/migrations/002_sambel_pecel_ludy_schema.sql" ]; then
        echo "✅ Main migration file exists"
    else
        echo "❌ Main migration file not found"
    fi
else
    echo "❌ supabase/migrations directory not found"
fi

echo ""
echo "🔧 Checking API routes..."

# Check API routes
API_DIR="src/app/api"
if [ -d "$API_DIR" ]; then
    API_COUNT=$(find "$API_DIR" -name "route.ts" | wc -l)
    echo "✅ Found $API_COUNT API route(s)"
    
    # Check critical routes
    for route in profile products shops transactions reports visits; do
        if [ -d "$API_DIR/$route" ]; then
            echo "  ✅ /api/$route"
        else
            echo "  ❌ /api/$route missing"
        fi
    done
else
    echo "❌ API directory not found"
fi

echo ""
echo "📱 Checking frontend pages..."

# Check main pages
PAGES_DIR="src/app"
for page in "sign-in" "sign-up" "dashboard"; do
    if [ -d "$PAGES_DIR/$page" ]; then
        echo "✅ $page page exists"
    else
        echo "❌ $page page missing"
    fi
done

echo ""
echo "📝 Documentation files:"

# Check documentation
for doc in BACKEND_SETUP.md SETUP_CARD.md README_SAMBEL_PECEL_LUDY.md BACKEND_COMPLETE.md; do
    if [ -f "$doc" ]; then
        echo "✅ $doc"
    else
        echo "❌ $doc missing"
    fi
done

echo ""
echo "============================================"
echo "🚀 Next Steps:"
echo "1. Run database migration in Supabase SQL Editor"
echo "2. Setup Clerk webhook (see BACKEND_SETUP.md)"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "For detailed setup guide, see: SETUP_CARD.md"
