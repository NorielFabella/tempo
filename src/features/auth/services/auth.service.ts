import { supabase } from '@/shared/supabase/client'

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/app`,
    },
  })
}

export async function signUp(
  email: string,
  password: string,
  fullName?: string,
) {
  return supabase.auth.signUp({
    email,
    password,
    options: fullName
      ? {
          data: {
            full_name: fullName.trim(),
          },
        }
      : undefined,
  })
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email)
}

export async function signOut() {
  return supabase.auth.signOut()
}
