import { supabase } from '@/shared/supabase/client'

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email)
}
