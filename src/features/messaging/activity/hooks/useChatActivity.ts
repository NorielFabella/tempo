import { useEffect } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'

import { updateChatActivity } from '../services/chatActivity.service'

export function useChatActivity() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const userId = user.id

    const syncChatActivity = () => {
      const isChatActive = document.visibilityState === 'visible'

      void updateChatActivity(userId, isChatActive).catch((error) => {
        console.error('Failed to update chat activity:', error)
      })
    }

    // ChatPage mounted.
    syncChatActivity()

    // Browser tab visibility changes.
    document.addEventListener('visibilitychange', syncChatActivity)

    return () => {
      document.removeEventListener('visibilitychange', syncChatActivity)

      // ChatPage unmounted.
      void updateChatActivity(userId, false).catch((error) => {
        console.error('Failed to clear chat activity:', error)
      })
    }
  }, [user?.id])
}
