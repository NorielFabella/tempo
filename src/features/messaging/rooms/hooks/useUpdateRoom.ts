import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateRoom } from '../services/room.service'

type UpdateRoomInput = {
  roomId: string
  name: string
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, name }: UpdateRoomInput) =>
      updateRoom(roomId, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['rooms'],
      })
    },
  })
}
