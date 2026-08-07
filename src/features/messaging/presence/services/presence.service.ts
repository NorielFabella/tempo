import type {
  RealtimeChannel,
  RealtimePresenceState,
} from '@supabase/supabase-js'

import { supabase } from '@/shared/supabase/client'

const GLOBAL_PRESENCE_CHANNEL = 'presence:global'

export function createPresenceChannel() {
  return supabase.channel(GLOBAL_PRESENCE_CHANNEL, {
    config: {
      presence: {
        key: 'global',
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

export async function updateLastSeen(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw error
  }
}

type PresenceMetadata = {
  presence_ref: string
  user_id: string
}

export function getOnlineUserIds(state: RealtimePresenceState): string[] {
  return [
    ...new Set(
      Object.values(state)
        .flat()
        .map((presence) => (presence as PresenceMetadata).user_id),
    ),
  ]
}
