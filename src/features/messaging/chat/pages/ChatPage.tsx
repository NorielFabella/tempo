import { useState } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMessages } from '@/features/messaging/chat/hooks/useMessages'
import { useSendMessage } from '@/features/messaging/chat/hooks/useSendMessage'
import { useCreateRoom } from '@/features/messaging/rooms/hooks/useCreateRoom'
import { useRooms } from '@/features/messaging/rooms/hooks/useRooms'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { supabase } from '@/shared/supabase/client'



export function ChatPage() {
  const { user } = useAuth()
  const { data: rooms, isLoading } = useRooms()
  const createRoomMutation = useCreateRoom()
  const sendMessageMutation = useSendMessage()
  const queryClient = useQueryClient()

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [roomName, setRoomName] = useState('')
  const [message, setMessage] = useState('')

  const activeRoomId = selectedRoomId ?? rooms?.[0]?.id ?? null

    useEffect(() => {
    if (!activeRoomId) {
      return
    }

    const channel = supabase
      .channel(`room:${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
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

  const {
  data: messages,
  isLoading: isMessagesLoading,
} = useMessages(activeRoomId ?? '')

  const selectedRoom = rooms?.find(
    (room) => room.id === activeRoomId,
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
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-lg border p-3"
                >
                  <p className="text-xs text-muted-foreground">
                    {message.sender_id}
                  </p>

                  <p className="mt-1">
                    {message.content}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(
                      message.created_at,
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
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
                setMessage(event.target.value)
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
