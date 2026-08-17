import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateMessage } from '../services/messages.service'

type EditMessageInput = {
  messageId: string
  roomId: string
  userId: string
  content: string
}

export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: EditMessageInput): Promise<void> => {
      await updateMessage(messageId, content)
    },

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['messages', variables.roomId],
      })

      void queryClient.invalidateQueries({
        queryKey: ['rooms', variables.userId],
      })
    },
  })
}
