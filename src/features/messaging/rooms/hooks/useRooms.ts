import { useQuery } from '@tanstack/react-query'

import { getRooms } from '../services/room.service'

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
  })
}
