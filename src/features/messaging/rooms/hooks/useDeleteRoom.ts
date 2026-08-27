import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteRoom } from '../services/room.service'

type DeleteRoomInput = {
  roomId: string
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId }: DeleteRoomInput) => deleteRoom(roomId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['rooms'],
      })
    },
  })
}
