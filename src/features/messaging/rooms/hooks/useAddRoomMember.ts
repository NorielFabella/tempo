import { useMutation, useQueryClient } from '@tanstack/react-query'

import { addRoomMember } from '../services/room.service'

type AddRoomMemberInput = {
  roomId: string
  userId: string
}

export function useAddRoomMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, userId }: AddRoomMemberInput) =>
      addRoomMember(roomId, userId),

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['room-members', variables.roomId],
      })

      void queryClient.invalidateQueries({
        queryKey: ['rooms'],
      })
    },
  })
}
