import { createClient } from '@supabase/supabase-js'

import { env } from '@/shared/config/env'
import type { Database } from '@/shared/types/database'

export const supabase = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
)

if (import.meta.env.DEV) {
  window.supabase = supabase
}
