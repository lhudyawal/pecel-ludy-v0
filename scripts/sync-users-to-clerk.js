#!/usr/bin/env node
/**
 * Sync users from Supabase to Clerk
 * This script creates Clerk users for profiles that exist in Supabase but not in Clerk
 * Run: node scripts/sync-users-to-clerk.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey || !clerkSecretKey) {
  console.error('❌ Missing environment variables!');
  console.error('Check .env.local has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('  - CLERK_SECRET_KEY\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Clerk API base URL (extract from publishable key)
const clerkBaseUrl = 'https://api.clerk.com/v1';

async function getClerkUsers() {
  const response = await fetch(`${clerkBaseUrl}/users?limit=100`, {
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Clerk users: ${response.statusText}`);
  }

  return response.json();
}

async function createClerkUser(userData) {
  const response = await fetch(`${clerkBaseUrl}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      first_name: userData.first_name,
      last_name: userData.last_name,
      email_address: [userData.email],
      password: userData.password || 'TempPass123!@#',
      public_metadata: {
        role: userData.role,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create Clerk user: ${error.errors?.[0]?.message || response.statusText}`);
  }

  return response.json();
}

async function syncUsers() {
  console.log('🔄 Syncing Supabase users to Clerk...\n');

  try {
    // Get all users from Supabase
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (supabaseError) {
      console.error('❌ Failed to fetch Supabase users:', supabaseError.message);
      process.exit(1);
    }

    console.log(`📊 Found ${supabaseUsers?.length || 0} user(s) in Supabase\n`);

    if (!supabaseUsers || supabaseUsers.length === 0) {
      console.log('ℹ️  No users found in Supabase');
      return;
    }

    // Get existing Clerk users
    console.log('📋 Fetching existing Clerk users...');
    const clerkUsers = await getClerkUsers();
    console.log(`   Found ${clerkUsers.length} user(s) in Clerk\n`);

    // Create a map of existing emails in Clerk
    const existingEmails = new Set(
      clerkUsers.map(user => user.email_addresses[0]?.email_address).filter(Boolean)
    );

    console.log('🔄 Syncing users...\n');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of supabaseUsers) {
      // Skip admin users (they should already exist)
      if (user.clerk_id && user.clerk_id.startsWith('user_')) {
        console.log(`⏭️  Skipping ${user.full_name} (${user.email}) - Already exists in Clerk`);
        skipped++;
        continue;
      }

      // Check if email already exists in Clerk
      if (existingEmails.has(user.email)) {
        console.log(`⏭️  Skipping ${user.full_name} (${user.email}) - Email already in Clerk`);
        skipped++;
        continue;
      }

      // Create user in Clerk
      console.log(`📝 Creating ${user.full_name} (${user.email})...`);

      const nameParts = user.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      try {
        const clerkUser = await createClerkUser({
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          password: `${user.full_name.split(' ')[0]}123!@#`, // Default password: FirstName123!@#
          role: user.role,
        });

        console.log(`   ✅ Created in Clerk (ID: ${clerkUser.id})`);
        console.log(`   🔑 Temporary password: ${clerkUser.first_name}123!@#\n`);

        // Update Supabase profile with new Clerk ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ clerk_id: clerkUser.id })
          .eq('id', user.id);

        if (updateError) {
          console.error(`   ⚠️  Failed to update Supabase profile: ${updateError.message}`);
        } else {
          console.log(`   📝 Updated Supabase profile with Clerk ID\n`);
        }

        created++;
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Sync Summary:');
    console.log(`   ✅ Created: ${created} user(s)`);
    console.log(`   ⏭️  Skipped: ${skipped} user(s)`);
    console.log(`   ❌ Errors: ${errors} user(s)`);
    console.log('='.repeat(50));

    if (created > 0) {
      console.log('\n⚠️  IMPORTANT:');
      console.log('   - Users can login with their email and temporary password');
      console.log('   - Temporary password format: FirstName123!@#');
      console.log('   - Ask users to change password after first login');
      console.log('   - Or send them invite links from Clerk Dashboard');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure CLERK_SECRET_KEY is correct');
    console.error('2. Make sure Supabase tables exist');
    console.error('3. Check network connection');
    process.exit(1);
  }
}

syncUsers();
