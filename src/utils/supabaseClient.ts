import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://hvrxreazzalwmjhiolhy.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_FYLDzzKTUPTg2zYaA7eyzQ_a7easZkG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'kiotvang_supabase_auth_token'
  }
});
