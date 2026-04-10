#!/usr/bin/env node
/**
 * Test script untuk verifikasi Supabase connection dan tables
 * Run: node scripts/test-supabase.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set!');
  console.error('Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔌 Testing Supabase connection...\n');

  // Test 1: Connection
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('not found')) {
        console.error('❌ FAIL: Table "profiles" does not exist!');
        console.error('\n📋 ACTION REQUIRED:');
        console.error('1. Open Supabase Dashboard: https://supabase.com/dashboard');
        console.error('2. Go to SQL Editor');
        console.error('3. Run migration: supabase/migrations/002_sambel_pecel_ludy_schema.sql');
        console.error('4. Then run this script again\n');
        return false;
      } else {
        console.error('❌ FAIL:', error.message);
        console.error('Error details:', error);
        return false;
      }
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Existing profiles:', data.length);
    
  } catch (err) {
    console.error('❌ FAIL:', err.message);
    return false;
  }

  // Test 2: Create test profile
  console.log('\n🧪 Testing profile creation...');
  
  const testProfile = {
    clerk_id: `test_${Date.now()}`,
    full_name: 'Test User',
    email: 'test@example.com',
    role: 'sales'
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(testProfile)
    .select()
    .single();

  if (error) {
    console.error('❌ Profile creation failed:', error.message);
    return false;
  }

  console.log('✅ Profile creation works!');
  console.log('   Created profile ID:', data.id);

  // Test 3: Cleanup
  console.log('\n🧹 Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('clerk_id', testProfile.clerk_id);

  if (deleteError) {
    console.error('⚠️  Cleanup failed:', deleteError.message);
  } else {
    console.log('✅ Cleanup successful');
  }

  console.log('\n🎉 All tests passed! Supabase is ready.');
  console.log('   You can now sign in to the application.');
  return true;
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
