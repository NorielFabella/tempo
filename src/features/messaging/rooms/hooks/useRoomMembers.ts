import { useQuery } from '@tanstack/react-query'

import { getRoomMemberIds } from '../services/room.service'

export function useRoomMembers(roomId: string) {
  return useQuery({
    queryKey: ['room-members', roomId],
    queryFn: () => getRoomMemberIds(roomId),
    enabled: Boolean(roomId),
  })
}
