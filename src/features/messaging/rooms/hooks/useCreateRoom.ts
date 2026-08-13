import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createRoom } from '../services/room.service'

type CreateRoomInput = {
  name: string
}

export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name }: CreateRoomInput) => createRoom(name),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['rooms'],
      })
    },
  })
}
