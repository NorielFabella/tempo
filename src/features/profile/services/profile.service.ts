import { supabase } from '@/shared/supabase/client'
import type { Profile } from '../types/profile'

export async function getCurrentProfile(): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not found.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw error
  }

  return data
}
