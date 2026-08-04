import { useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMarkMessagesAsRead } from '@/features/messaging/chat/hooks/useMarkMessagesAsRead'
import { useMessages } from '@/features/messaging/chat/hooks/useMessages'
import { useSendMessage } from '@/features/messaging/chat/hooks/useSendMessage'
import { useTyping } from '@/features/messaging/chat/hooks/useTyping'
import { useCreateRoom } from '@/features/messaging/rooms/hooks/useCreateRoom'
import { useRooms } from '@/features/messaging/rooms/hooks/useRooms'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { supabase } from '@/shared/supabase/client'

export function ChatPage() {
  const { user } = useAuth()
  const { data: rooms, isLoading } = useRooms()
  const createRoomMutation = useCreateRoom()
  const sendMessageMutation = useSendMessage()

  const markMessagesAsReadMutation = useMarkMessagesAsRead()
  const queryClient = useQueryClient()

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [roomName, setRoomName] = useState('')
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeRoomId = selectedRoomId ?? rooms?.[0]?.id ?? null

    const {
      data: messages,
      isLoading: isMessagesLoading,
    } = useMessages(activeRoomId ?? '')

    const {
      data: typingUsers,
      setTyping: setTypingMutation,
    } = useTyping(activeRoomId ?? '')

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      })
    }, [messages])

    useEffect(() => {
    if (!activeRoomId) {
      return
    }

    const channel = supabase
      .channel(`room:${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${activeRoomId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['messages', activeRoomId],
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeRoomId, queryClient])

  useEffect(() => {
    if (!activeRoomId) {
      return
    }

    const channel = supabase
      .channel(`typing:${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `room_id=eq.${activeRoomId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['typing', activeRoomId],
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeRoomId, queryClient])

  useEffect(() => {
    if (!user || !activeRoomId || !messages?.length) {
      return
    }

    const hasUnreadMessages = messages.some(
      (message) =>
        message.sender_id !== user.id &&
        message.read_at === null,
    )

    if (!hasUnreadMessages) {
      return
    }

    if (!markMessagesAsReadMutation.isPending) {
      void markMessagesAsReadMutation.mutate({
        roomId: activeRoomId,
        userId: user.id,
      })
    }
  }, [
    activeRoomId,
    messages,
    user,
    markMessagesAsReadMutation,
  ])

  const selectedRoom = rooms?.find(
    (room) => room.id === activeRoomId,
  )

  const otherTypingUsers =
    (typingUsers ?? []).filter(
      (typingUser) => typingUser.user_id !== user?.id,
    )

  async function handleCreateRoom() {

    if (!user || !roomName.trim()) {
      return
    }

    await createRoomMutation.mutateAsync({
      name: roomName.trim(),
      userId: user.id,
    })

    setRoomName('')
  }

  async function handleSendMessage() {
    if (
      !user ||
      !activeRoomId ||
      !message.trim()
    ) {
      return
    }

    await sendMessageMutation.mutateAsync({
      roomId: activeRoomId,
      senderId: user.id,
      content: message.trim(),
    })

    await setTypingMutation.mutateAsync({
      roomId: activeRoomId,
      userId: user.id,
      isTyping: false,
    })

    setMessage('')
  }

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* Rooms Sidebar */}
      <Card className="flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">
            Rooms
          </h2>

          <div className="mt-4 space-y-2">
            <Input
              placeholder="Room name..."
              value={roomName}
              onChange={(event) => {
                setRoomName(event.target.value)
              }}
            />

            <Button
              className="w-full"
              onClick={() => {
                void handleCreateRoom()
              }}
              disabled={
                createRoomMutation.isPending ||
                !roomName.trim()
              }
            >
              {createRoomMutation.isPending
                ? 'Creating...'
                : 'New Room'}
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {rooms?.length ? (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => {
                  setSelectedRoomId(room.id)
                }}
                className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                  room.id === activeRoomId
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'hover:bg-muted'
                }`}
              >
                <p className="font-medium">
                  {room.name ?? 'Direct Message'}
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No rooms found.
            </p>
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">
            {selectedRoom?.name ?? 'Direct Message'}
          </h2>

          <p className="text-sm text-muted-foreground">
            Room ID: {selectedRoom?.id ?? '-'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isMessagesLoading ? (
            <p className="text-center text-muted-foreground">
              Loading messages...
            </p>
          ) : messages?.length ? (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage =
                  message.sender_id === user?.id

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isOwnMessage
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl border px-4 py-3 ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-card'
                      }`}
                    >
                      <p
                        className={`text-xs ${
                          isOwnMessage
                            ? 'text-blue-100'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {message.sender_id}
                      </p>

                      <p className="mt-1 break-words">
                        {message.content}
                      </p>

                      <div
                        className={`mt-2 flex items-center gap-2 text-xs ${
                          isOwnMessage
                            ? 'text-blue-100'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <span>
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>

                        {isOwnMessage && (
                          <span>
                            {message.read_at ? 'Seen' : 'Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {otherTypingUsers.length > 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Someone is typing...
                </p>
              )}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No messages yet.

            </p>

          )}
        </div>

        <div className="border-t p-4">
          <div className="flex gap-3">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(event) => {
                const value = event.target.value

                setMessage(value)

                if (user && activeRoomId) {
                  void setTypingMutation.mutate({
                    roomId: activeRoomId,
                    userId: user.id,
                    isTyping: value.length > 0,
                  })
                }
              }}
              onBlur={() => {
                if (user && activeRoomId) {
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
              onClick={() => {
                void handleSendMessage()
              }}
              disabled={
                sendMessageMutation.isPending ||
                !message.trim() ||
                !activeRoomId
              }
            >
              {sendMessageMutation.isPending
                ? 'Sending...'
                : 'Send'}
            </Button>

          </div>
        </div>
      </Card>
    </div>
  )
}
