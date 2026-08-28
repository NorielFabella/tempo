import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'

import { getUnreadNotificationCount } from '../services/notification.service'

export function useUnreadNotificationCount() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['notifications', userId, 'unread-count'],
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(userId),
  })
}
