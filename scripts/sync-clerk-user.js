#!/usr/bin/env node
/**
 * Sync user dari Clerk ke Supabase
 * Run: node scripts/sync-clerk-user.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !clerkSecretKey) {
  console.error('❌ Missing environment variables!');
  console.error('Check .env.local has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('  - CLERK_SECRET_KEY\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const clerkClient = createClerkClient({ secretKey: clerkSecretKey });

async function syncUsers() {
  console.log('🔄 Syncing Clerk users to Supabase...\n');

  try {
    // Get all users from Clerk
    const userList = await clerkClient.users.getUserList();
    const users = userList.data || userList;

    if (!users || users.length === 0) {
      console.log('ℹ️  No users found in Clerk');
      return;
    }

    console.log(`📊 Found ${users.length} user(s) in Clerk\n`);

    for (const user of users) {
      const email = user.emailAddresses[0]?.emailAddress || '';
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
      const avatarUrl = user.imageUrl || null;

      console.log(`⚙️  Syncing: ${fullName} (${email})`);
      console.log(`   Clerk ID: ${user.id}`);

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (existingProfile) {
        console.log(`   ✅ Profile already exists, updating...\n`);
        
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            email: email,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_id', user.id);

        if (error) {
          console.error(`   ❌ Update failed:`, error.message);
        } else {
          console.log(`   ✅ Updated successfully\n`);
        }
      } else {
        console.log(`   📝 Creating new profile...\n`);

        const { data, error } = await supabase
          .from('profiles')
          .insert({
            clerk_id: user.id,
            full_name: fullName,
            email: email,
            role: 'sales', // Default role
            avatar_url: avatarUrl
          })
          .select()
          .single();

        if (error) {
          console.error(`   ❌ Creation failed:`, error.message);
        } else {
          console.log(`   ✅ Created successfully (ID: ${data.id})\n`);
        }
      }
    }

    console.log('🎉 All users synced to Supabase!');
    console.log('   You can now access the dashboard.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure CLERK_SECRET_KEY is correct');
    console.error('2. Make sure Supabase tables exist (run migration)');
    process.exit(1);
  }
}

syncUsers();
