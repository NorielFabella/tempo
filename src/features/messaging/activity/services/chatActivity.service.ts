import { supabase } from '@/shared/supabase/client'

export async function updateChatActivity(
  userId: string,
  isChatActive: boolean,
) {
  const { error } = await supabase
    .from('user_chat_activity')
    .upsert(
      {
        user_id: userId,
        is_chat_active: isChatActive,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      },
    )

  if (error) {
    throw error
  }
}
