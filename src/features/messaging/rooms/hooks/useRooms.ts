import { useQuery } from '@tanstack/react-query'

import { getRoomsWithMetadata } from '../services/room.service'

export function useRooms(currentUserId: string | undefined) {
  return useQuery({
    queryKey: ['rooms', currentUserId],
    queryFn: () => getRoomsWithMetadata(currentUserId!),
    enabled: Boolean(currentUserId),
  })
}
