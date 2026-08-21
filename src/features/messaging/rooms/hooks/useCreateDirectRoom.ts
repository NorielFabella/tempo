import { useMutation } from '@tanstack/react-query'
import { getOrCreateDirectRoom } from '../services/room.service'

export function useCreateDirectRoom() {
  return useMutation({
    mutationFn: (otherUserId: string) =>
      getOrCreateDirectRoom(otherUserId),
  })
}
