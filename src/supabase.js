import { createClient } from '@supabase/supabase-js'

// These values are intentionally publishable client credentials. Access to private
// records is enforced by Supabase Auth and Row Level Security, not by hiding this key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://obwbalpxttdfbeushvaw.supabase.co'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_LU8Gi0RscZ-m63Bm1pAHNw_8wQ-ONHq'

export const supabase = createClient(supabaseUrl, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
