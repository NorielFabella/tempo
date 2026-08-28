import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'

import { getNotifications } from '../services/notification.service'

export function useNotifications() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: getNotifications,
    enabled: Boolean(userId),
  })
}
