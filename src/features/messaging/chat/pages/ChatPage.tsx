import { useEffect, useMemo, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMarkMessagesAsRead } from '@/features/messaging/chat/hooks/useMarkMessagesAsRead'
import { useMessages } from '@/features/messaging/chat/hooks/useMessages'
import { useSendMessage } from '@/features/messaging/chat/hooks/useSendMessage'
import { useTyping } from '@/features/messaging/chat/hooks/useTyping'
import { usePresence } from '@/features/messaging/presence/hooks/usePresence'
import { useCreateRoom } from '@/features/messaging/rooms/hooks/useCreateRoom'
import { useRoomMembers } from '@/features/messaging/rooms/hooks/useRoomMembers'
import { useRooms } from '@/features/messaging/rooms/hooks/useRooms'
import { useProfiles } from '@/features/profile/hooks/useProfiles'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { supabase } from '@/shared/supabase/client'

function getDisplayName(fullName: string | null, email: string) {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0]
  }

  return email
}

function formatLastSeen(lastSeenAt: string | null) {
  if (!lastSeenAt) {
    return 'never'
  }

  const lastSeen = new Date(lastSeenAt)
  const now = new Date()

  const diffMs = Math.max(0, now.getTime() - lastSeen.getTime())
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) {
    return 'just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)

  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

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
  const typingTimeoutRef = useRef<number | null>(null)

  const activeRoomId = selectedRoomId ?? rooms?.[0]?.id ?? null

  const { data: messages, isLoading: isMessagesLoading } = useMessages(
    activeRoomId ?? '',
  )

  const { data: typingUsers, setTyping: setTypingMutation } = useTyping(
    activeRoomId ?? '',
  )

  const { data: roomMemberIds = [] } = useRoomMembers(activeRoomId ?? '')

  const { onlineUserIds } = usePresence()

  const otherTypingUsers = (typingUsers ?? []).filter(
    (typingUser) => typingUser.user_id !== user?.id,
  )

  const { data: typingProfiles = [] } = useProfiles(
    otherTypingUsers.map((typingUser) => typingUser.user_id),
  )

  const otherRoomMemberIds = roomMemberIds.filter(
    (userId) => userId !== user?.id,
  )

  const otherOnlineUserIds = onlineUserIds.filter(
    (userId) => userId !== user?.id && roomMemberIds.includes(userId),
  )

  const offlineRoomMemberIds = otherRoomMemberIds.filter(
    (userId) => !onlineUserIds.includes(userId),
  )

  const { data: onlineRoomProfiles = [] } = useProfiles(otherOnlineUserIds)

  const { data: offlineRoomProfiles = [] } = useProfiles(offlineRoomMemberIds)

  const recentlyActiveProfiles = useMemo(() => {
    const now = new Date().getTime()

    return offlineRoomProfiles.filter((profile) => {
      if (!profile.last_seen_at) {
        return false
      }

      const diffMs = now - new Date(profile.last_seen_at).getTime()

      return diffMs <= 60 * 60_000
    })
  }, [offlineRoomProfiles])

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
      (message) => message.sender_id !== user.id && message.read_at === null,
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
  }, [activeRoomId, messages, user, markMessagesAsReadMutation])

  const selectedRoom = rooms?.find((room) => room.id === activeRoomId)

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
    if (!user || !activeRoomId || !message.trim()) {
      return
    }

    await sendMessageMutation.mutateAsync({
      roomId: activeRoomId,
      senderId: user.id,
      content: message.trim(),
    })

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
    }

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
          <h2 className="text-lg font-semibold">Rooms</h2>

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
              disabled={createRoomMutation.isPending || !roomName.trim()}
            >
              {createRoomMutation.isPending ? 'Creating...' : 'New Room'}
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
                <p className="font-medium">{room.name ?? 'Direct Message'}</p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No rooms found.</p>
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

          {onlineRoomProfiles.length > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {onlineRoomProfiles.length === 1
                ? `${getDisplayName(
                    onlineRoomProfiles[0].full_name,
                    onlineRoomProfiles[0].email,
                  )} is online`
                : `${onlineRoomProfiles.length} people online`}
            </p>
          ) : offlineRoomProfiles.length === 1 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {getDisplayName(
                offlineRoomProfiles[0].full_name,
                offlineRoomProfiles[0].email,
              )}{' '}
              was last seen{' '}
              {formatLastSeen(offlineRoomProfiles[0].last_seen_at)}
            </p>
          ) : offlineRoomProfiles.length > 1 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {recentlyActiveProfiles.length > 0
                ? `${recentlyActiveProfiles.length} recently active`
                : `${offlineRoomProfiles.length} members offline`}
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isMessagesLoading ? (
            <p className="text-center text-muted-foreground">
              Loading messages...
            </p>
          ) : messages?.length ? (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === user?.id

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl border px-4 py-3 ${
                        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-card'
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

                      <p className="mt-1 break-words">{message.content}</p>

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
                          <span>{message.read_at ? 'Seen' : 'Sent'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />

              {typingProfiles.length > 0 && (
                <p className="mt-3 text-sm italic text-muted-foreground">
                  {typingProfiles
                    .map((profile) =>
                      getDisplayName(profile.full_name, profile.email),
                    )
                    .join(', ')}{' '}
                  {typingProfiles.length === 1
                    ? 'is typing...'
                    : 'are typing...'}
                </p>
              )}
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

                if (!user || !activeRoomId) {
                  return
                }

                void setTypingMutation.mutate({
                  roomId: activeRoomId,
                  userId: user.id,
                  isTyping: value.length > 0,
                })

                if (typingTimeoutRef.current) {
                  window.clearTimeout(typingTimeoutRef.current)
                }

                if (value.length > 0) {
                  typingTimeoutRef.current = window.setTimeout(() => {
                    void setTypingMutation.mutate({
                      roomId: activeRoomId,
                      userId: user.id,
                      isTyping: false,
                    })
                  }, 2000)
                }
              }}
              onBlur={() => {
                if (typingTimeoutRef.current) {
                  window.clearTimeout(typingTimeoutRef.current)
                }

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
              {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
