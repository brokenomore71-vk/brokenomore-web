import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a fallback client with dummy values if env vars are not set
// This prevents runtime errors during development
const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
    console.warn('⚠️ Supabase environment variables are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
    // Return a client with placeholder values to prevent errors
    // This will fail on actual API calls, but won't crash the app
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
};

export const supabase = getSupabaseClient();

