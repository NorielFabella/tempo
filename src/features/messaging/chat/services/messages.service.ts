import { supabase } from '@/shared/supabase/client'
import type { Message } from '../types/message'


export async function getRoomMessages(
  roomId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  content: string,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      content,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
