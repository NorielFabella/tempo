import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteMessage } from '../services/messages.service'

type DeleteMessageInput = {
  messageId: string
  roomId: string
  userId: string
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
    }: DeleteMessageInput): Promise<void> => {
      await deleteMessage(messageId)
    },

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['messages', variables.roomId],
      })

      void queryClient.invalidateQueries({
        queryKey: ['message-attachments'],
      })

      void queryClient.invalidateQueries({
        queryKey: ['rooms', variables.userId],
      })
    },
  })
}
