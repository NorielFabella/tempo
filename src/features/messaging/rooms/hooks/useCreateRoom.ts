import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createRoom
} from '../services/room.service'

type CreateRoomInput = {
  name: string
  userId: string
}

export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      userId,
    }: CreateRoomInput) => {

      await createRoom(
        name,
        userId,
      )

      return true
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['rooms'],
      })
    },
  })
}
