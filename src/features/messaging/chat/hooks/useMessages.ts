import { useQuery } from '@tanstack/react-query'

import { getRoomMessages } from '../services/messages.service'

export function useMessages(roomId: string) {
  return useQuery({
    queryKey: ['messages', roomId],
    queryFn: () => getRoomMessages(roomId),
    enabled: Boolean(roomId),
  })
}
