import { supabase } from '@/shared/supabase/client'

export async function setTypingStatus(
  roomId: string,
  userId: string,
  isTyping: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('typing_status')
    .upsert(
      {
        room_id: roomId,
        user_id: userId,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'room_id,user_id',
      },
    )

  if (error) {
    throw error
  }
}

export async function getTypingUsers(roomId: string) {
  const { data, error } = await supabase
    .from('typing_status')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_typing', true)

  if (error) {
    console.error(error)
    throw error
  }

  return data
}
