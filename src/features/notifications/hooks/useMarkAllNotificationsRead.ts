import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'

import { markAllNotificationsAsRead } from '../services/notification.service'

export function useMarkAllNotificationsRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      if (!userId) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: ['notifications', userId],
      })

      void queryClient.invalidateQueries({
        queryKey: ['notifications', userId, 'unread-count'],
      })
    },
  })
}
