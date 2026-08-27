import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  removeRoomAvatar,
  uploadRoomAvatar,
} from '../services/room.service'

type RoomAvatarMutationInput = {
  roomId: string
  userId: string
  file?: File
}

export function useRoomAvatarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, file }: RoomAvatarMutationInput) =>
      file ? uploadRoomAvatar(roomId, file) : removeRoomAvatar(roomId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['rooms', variables.userId],
      })
    },
  })
}
