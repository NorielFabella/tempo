import { useMutation, useQueryClient } from '@tanstack/react-query'

import { sendMessage } from '../services/messages.service'

type SendMessageInput = {
  roomId: string
  senderId: string
  content: string
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      roomId,
      senderId,
      content,
    }: SendMessageInput) =>
      sendMessage(
        roomId,
        senderId,
        content,
      ),

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['messages', variables.roomId],
      })
    },
  })
}
