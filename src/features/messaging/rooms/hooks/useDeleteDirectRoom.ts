import { useMutation, useQueryClient } from '@tanstack/react-query'

import { hideDirectRoom } from '../services/room.service'

type DeleteDirectRoomInput = {
  roomId: string
  userId: string
}

export function useDeleteDirectRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId }: DeleteDirectRoomInput) => hideDirectRoom(roomId),

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['rooms', variables.userId],
      })
    },
  })
}
