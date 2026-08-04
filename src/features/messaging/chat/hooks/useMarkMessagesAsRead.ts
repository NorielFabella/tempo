import { useMutation, useQueryClient } from '@tanstack/react-query'

import { markRoomMessagesAsRead } from '../services/messages.service'

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      roomId,
      userId,
    }: {
      roomId: string
      userId: string
    }) =>
      markRoomMessagesAsRead(
        roomId,
        userId,
      ),

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['messages', variables.roomId],
      })
    },
  })
}
