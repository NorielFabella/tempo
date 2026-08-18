import { useRef, useState } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { AttachmentPicker } from '@/features/messaging/attachments/components/AttachmentPicker'
import { validateAttachments } from '@/features/messaging/attachments/services/attachments.service'
import { useSendMessage } from '@/features/messaging/chat/hooks/useSendMessage'
import { useTyping } from '@/features/messaging/chat/hooks/useTyping'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

type MessageComposerProps = {
  activeRoomId: string | null
  onMessageSent: () => void
}

export function MessageComposer({
  activeRoomId,
  onMessageSent,
}: MessageComposerProps) {
  const { user } = useAuth()
  const sendMessageMutation = useSendMessage()
  const { setTyping: setTypingMutation } = useTyping(activeRoomId ?? '')

  const [message, setMessage] = useState('')
  const [attachmentsToSend, setAttachmentsToSend] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const typingTimeoutRef = useRef<number | null>(null)
  const isTypingRef = useRef(false)

  async function handleSendMessage() {
    const content = message.trim()

    if (
      !user ||
      !activeRoomId ||
      (!content && attachmentsToSend.length === 0)
    ) {
      return
    }

    setSendError(null)

    try {
      const result = await sendMessageMutation.mutateAsync({
        roomId: activeRoomId,
        senderId: user.id,
        content,
        attachments: attachmentsToSend,
      })

      setMessage('')
      setAttachmentsToSend([])
      setAttachmentError(result.attachmentError)

      onMessageSent()
    } catch {
      setSendError('Your message could not be sent. Please try again.')

      return
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    isTypingRef.current = false

    await setTypingMutation.mutateAsync({
      roomId: activeRoomId,
      userId: user.id,
      isTyping: false,
    })
  }

  function handleAddAttachments(files: File[]) {
    const nextAttachments = [...attachmentsToSend, ...files]

    try {
      validateAttachments(nextAttachments)
      setAttachmentsToSend(nextAttachments)
      setAttachmentError(null)
    } catch (error) {
      setAttachmentError(
        error instanceof Error
          ? error.message
          : 'The selected file could not be attached.',
      )
    }
  }

  function handleRemoveAttachment(index: number) {
    setAttachmentsToSend((attachments) =>
      attachments.filter(
        (_, attachmentIndex) => attachmentIndex !== index,
      ),
    )
    setAttachmentError(null)
  }

  return (
    <div className="border-t p-3 sm:p-4">
      <div className="space-y-3">
        {sendError && (
          <p role="alert" className="text-sm text-red-600">
            {sendError}
          </p>
        )}

        <AttachmentPicker
          attachments={attachmentsToSend}
          disabled={sendMessageMutation.isPending || !activeRoomId}
          error={attachmentError}
          onAdd={handleAddAttachments}
          onRemove={handleRemoveAttachment}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Type a message..."
            aria-label="Message"
            className="min-w-0 flex-1"
            value={message}
            onChange={(event) => {
              const value = event.target.value

              setMessage(value)

              if (!user || !activeRoomId) {
                return
              }

              if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = null
              }

              if (value.length === 0) {
                if (isTypingRef.current) {
                  isTypingRef.current = false

                  void setTypingMutation.mutate({
                    roomId: activeRoomId,
                    userId: user.id,
                    isTyping: false,
                  })
                }

                return
              }

              if (!isTypingRef.current) {
                isTypingRef.current = true

                void setTypingMutation.mutate({
                  roomId: activeRoomId,
                  userId: user.id,
                  isTyping: true,
                })
              }

              typingTimeoutRef.current = window.setTimeout(() => {
                isTypingRef.current = false

                void setTypingMutation.mutate({
                  roomId: activeRoomId,
                  userId: user.id,
                  isTyping: false,
                })
              }, 2000)
            }}
            onBlur={() => {
              if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = null
              }

              if (user && activeRoomId && isTypingRef.current) {
                isTypingRef.current = false

                void setTypingMutation.mutate({
                  roomId: activeRoomId,
                  userId: user.id,
                  isTyping: false,
                })
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSendMessage()
              }
            }}
          />

          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => {
              void handleSendMessage()
            }}
            disabled={
              sendMessageMutation.isPending ||
              (!message.trim() && attachmentsToSend.length === 0) ||
              !activeRoomId
            }
          >
            {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
