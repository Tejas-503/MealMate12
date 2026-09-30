import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('--- MealMate Supabase Diagnostics ---');
console.log('Testing Supabase URL:', url || '(NOT SET)');
console.log('Anon Key Present:', Boolean(key), key ? `(${key.slice(0, 15)}...)` : '');

if (!url || !key) {
  console.error('\n❌ ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from your .env file!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function runDiagnostics() {
  try {
    console.log('\n[1/2] Connecting to Supabase API...');
    const startTime = Date.now();
    const { data, error } = await supabase.from('menu_items').select('id, name, price').limit(3);
    const duration = Date.now() - startTime;

    if (error) {
      console.error(`\n❌ Supabase request failed: ${error.message}`);
      if (error.code === '42P01') {
        console.log('\n💡 HINT: The table "menu_items" does not exist yet.');
        console.log('👉 Please run the "supabase_schema.sql" file in your Supabase SQL Editor.');
      } else if (error.message.includes('fetch failed')) {
        console.log('\n💡 CAUSE: The domain "pcoubbsrucvxcvbbumzg.supabase.co" does not exist or is not answering.');
        console.log('👉 1. Log in to https://supabase.com/dashboard');
        console.log('👉 2. Check if your project status is "Active", "Restoring", or "Paused".');
        console.log('👉 3. If you created a new project or resumed, go to Project Settings -> API.');
        console.log('👉 4. Copy the new "Project URL" and "anon public key" into your .env file.');
      }
      return;
    }

    console.log(`\n✅ Connection SUCCESSFUL! (${duration}ms)`);
    console.log(`Found ${data.length} menu item(s):`);
    data.forEach(item => console.log(` - ${item.name} (₹${item.price})`));

    console.log('\n[2/2] Checking auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.warn('Auth check warning:', authError.message);
    } else {
      console.log('✅ Supabase Auth service is online and ready.');
    }

    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
  } catch (err) {
    console.error('\n❌ NETWORK / CONNECTION FAILED:');
    console.error(err.message || err);
    if (err.cause) {
      console.error('Root cause:', err.cause);
    }
    console.log('\n💡 Why this happens:');
    console.log(' 1. The Supabase project URL in .env is paused, terminated, or non-existent.');
    console.log(' 2. If you just unpaused it, it may take 3-5 minutes for DNS to resolve.');
    console.log(' 3. If it was paused for 3 months, Supabase may have assigned a NEW Project URL & Anon Key.');
    console.log('    Check your Supabase Dashboard -> Project Settings -> API to copy the new credentials.');
  }
}

runDiagnostics();
