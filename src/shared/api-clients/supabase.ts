import { createClient } from '@supabase/supabase-js';

// Functions to get clients that read env at call time
export const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl) throw new Error('supabaseUrl is required.');
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl) throw new Error('supabaseUrl is required.');
  return createClient(supabaseUrl, supabaseServiceKey);
};
