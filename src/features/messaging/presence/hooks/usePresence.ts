import { useContext, useEffect, useState } from 'react'

import { type RealtimeChannel } from '@supabase/supabase-js'

import { useAuth } from '@/features/auth/hooks/useAuth'

import { PresenceContext } from '../context/PresenceContext'
import {
  createPresenceChannel,
  getOnlineUserIds,
  trackPresence,
  untrackPresence,
  updateLastSeen,
} from '../services/presence.service'

const LAST_SEEN_INTERVAL = 30_000

export function usePresence() {
  const context = useContext(PresenceContext)

  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider.')
  }

  return context
}

export function useGlobalPresence() {
  const { user } = useAuth()

  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      return
    }

    const channel: RealtimeChannel = createPresenceChannel()

    const updatePresence = () => {
      setOnlineUserIds(getOnlineUserIds(channel.presenceState()))
    }

    channel
      .on('presence', { event: 'sync' }, updatePresence)
      .on('presence', { event: 'join' }, updatePresence)
      .on('presence', { event: 'leave' }, updatePresence)
      .subscribe((status) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (status === 'SUBSCRIBED') {
          void trackPresence(channel, user.id)
          void updateLastSeen(user.id)
        }
      })

    const heartbeat = window.setInterval(() => {
      void updateLastSeen(user.id)
    }, LAST_SEEN_INTERVAL)

    return () => {
      window.clearInterval(heartbeat)

      void untrackPresence(channel)
      void channel.unsubscribe()
    }
  }, [user])

  return {
    onlineUserIds,
  }
}
