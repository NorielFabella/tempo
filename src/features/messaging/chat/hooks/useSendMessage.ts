import { useMutation, useQueryClient } from '@tanstack/react-query'

import { uploadMessageAttachments } from '@/features/messaging/attachments/services/attachments.service'

import { sendMessage } from '../services/messages.service'
import type { Message } from '../types/message'

type SendMessageInput = {
  roomId: string
  senderId: string
  content: string
  attachments: File[]
}

type SendMessageResult = {
  message: Message
  attachmentError: string | null
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      roomId,
      senderId,
      content,
      attachments,
    }: SendMessageInput): Promise<SendMessageResult> => {
      const message = await sendMessage(roomId, senderId, content)

      if (!attachments.length) {
        return { message, attachmentError: null }
      }

      try {
        await uploadMessageAttachments(message.id, attachments)

        return { message, attachmentError: null }
      } catch (error) {
        return {
          message,
          attachmentError:
            error instanceof Error
              ? error.message
              : 'Your message was sent, but its attachment could not be uploaded.',
        }
      }
    },

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['messages', variables.roomId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['message-attachments'],
      })
    },
  })
}
