import { supabase } from '@/shared/supabase/client'
import type { Tables } from '@/shared/types/database'

export type Room = Tables<'rooms'>

export async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function createRoom(name: string, createdBy: string) {
  const { error } = await supabase.from('rooms').insert({
    name,
    created_by: createdBy,
    is_group: true,
  })

  if (error) {
    throw error
  }

  return true
}
