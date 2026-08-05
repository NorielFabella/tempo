import type {
  RealtimeChannel,
  RealtimePresenceState,
} from '@supabase/supabase-js'

import { supabase } from '@/shared/supabase/client'

export function createPresenceChannel(roomId: string) {
  return supabase.channel(`presence:${roomId}`, {
    config: {
      presence: {
        key: roomId,
      },
    },
  })
}

export async function trackPresence(channel: RealtimeChannel, userId: string) {
  await channel.track({
    user_id: userId,
  })
}

export async function untrackPresence(channel: RealtimeChannel) {
  await channel.untrack()
}

type PresenceMetadata = {
  presence_ref: string
  user_id: string
}

export function getOnlineUserIds(state: RealtimePresenceState): string[] {
  return Object.values(state)
    .flat()
    .map((presence) => (presence as PresenceMetadata).user_id)
}
