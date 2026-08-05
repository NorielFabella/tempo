import { useEffect, useState } from 'react'

import { type RealtimeChannel } from '@supabase/supabase-js'

import { useAuth } from '@/features/auth/hooks/useAuth'

import {
  createPresenceChannel,
  getOnlineUserIds,
  trackPresence,
  untrackPresence,
} from '../services/presence.service'

export function usePresence(roomId: string) {
  const { user } = useAuth()

  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])

  useEffect(() => {
    if (!roomId || !user) {
      return
    }

    const channel: RealtimeChannel = createPresenceChannel(roomId)

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUserIds(getOnlineUserIds(channel.presenceState()))
      })
      .subscribe((status) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (status === 'SUBSCRIBED') {
          void trackPresence(channel, user.id)
        }
      })

    return () => {
      void untrackPresence(channel)
      void channel.unsubscribe()
    }
  }, [roomId, user])

  return {
    onlineUserIds,
  }
}
