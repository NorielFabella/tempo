import { useEffect, useMemo, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { AttachmentList } from '@/features/messaging/attachments/components/AttachmentList'
import { AttachmentPicker } from '@/features/messaging/attachments/components/AttachmentPicker'
import { useMessageAttachments } from '@/features/messaging/attachments/hooks/useMessageAttachments'
import { validateAttachments } from '@/features/messaging/attachments/services/attachments.service'
import { useMarkMessagesAsRead } from '@/features/messaging/chat/hooks/useMarkMessagesAsRead'
import { useMessages } from '@/features/messaging/chat/hooks/useMessages'
import { useSendMessage } from '@/features/messaging/chat/hooks/useSendMessage'
import { useTyping } from '@/features/messaging/chat/hooks/useTyping'
import { usePresence } from '@/features/messaging/presence/hooks/usePresence'
import { RoomList } from '@/features/messaging/rooms/components/RoomList'
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
  const {
    data: rooms,
    isLoading: areRoomsLoading,
    isError: areRoomsUnavailable,
    refetch: refetchRooms,
  } = useRooms(user?.id)
  const createRoomMutation = useCreateRoom()
  const sendMessageMutation = useSendMessage()

  const markMessagesAsReadMutation = useMarkMessagesAsRead()
  const queryClient = useQueryClient()

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [isMobileRoomListOpen, setIsMobileRoomListOpen] = useState(true)
  const [roomName, setRoomName] = useState('')
  const [message, setMessage] = useState('')
  const [attachmentsToSend, setAttachmentsToSend] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const previousRoomIdRef = useRef<string | null>(null)
  const previousMessageIdsRef = useRef<string[]>([])
  const typingTimeoutRef = useRef<number | null>(null)
  const shouldScrollToRoomBottomRef = useRef(false)
  // const isInitialRoomScrollPendingRef = useRef(false)

  const activeRoomId = selectedRoomId ?? rooms?.[0]?.id ?? null

  const {
    data: messages,
    isLoading: isMessagesLoading,
    isError: areMessagesUnavailable,
    refetch: refetchMessages,
  } = useMessages(activeRoomId ?? '')

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

  const messageSenderIds = useMemo(
    () => [...new Set((messages ?? []).map((message) => message.sender_id))],
    [messages],
  )

  const { data: messageProfiles = [] } = useProfiles(messageSenderIds)

  const messageProfilesById = useMemo(
    () => new Map(messageProfiles.map((profile) => [profile.id, profile])),
    [messageProfiles],
  )

  const messageIds = useMemo(
    () => (messages ?? []).map((chatMessage) => chatMessage.id),
    [messages],
  )

  const {
    data: messageAttachments = [],
    isError: areAttachmentsUnavailable,
    refetch: refetchAttachments,
  } = useMessageAttachments(messageIds)

  const attachmentsByMessageId = useMemo(() => {
    const attachmentsById = new Map<string, typeof messageAttachments>()

    for (const attachment of messageAttachments) {
      const attachments = attachmentsById.get(attachment.message_id) ?? []

      attachmentsById.set(attachment.message_id, [...attachments, attachment])
    }

    return attachmentsById
  }, [messageAttachments])

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

  function scrollToLatest(behavior: ScrollBehavior = 'smooth') {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const isNearBottom = distanceFromBottom <= 100

    isAtBottomRef.current = isNearBottom
    setIsAtBottom(isNearBottom)

    if (isNearBottom) {
      setHasNewMessages(false)
    }
  }

  useEffect(() => {
    if (activeRoomId !== previousRoomIdRef.current) {
      previousRoomIdRef.current = activeRoomId
      previousMessageIdsRef.current = []

      isAtBottomRef.current = true
      setIsAtBottom(true)
      setHasNewMessages(false)

      shouldScrollToRoomBottomRef.current = true
      // isInitialRoomScrollPendingRef.current = true
    }
  }, [activeRoomId])

  useEffect(() => {
    if (!messages) {
      return
    }

    const messageIds = messages.map((chatMessage) => chatMessage.id)
    const previousMessageIds = previousMessageIdsRef.current

    const hasReceivedNewMessages =
      previousMessageIds.length > 0 &&
      messageIds.some((messageId) => !previousMessageIds.includes(messageId))

    previousMessageIdsRef.current = messageIds

    // Initial room positioning is handled separately.
    if (shouldScrollToRoomBottomRef.current) {
      return
    }

    if (isAtBottomRef.current) {
      scrollToLatest()
      setHasNewMessages(false)
    } else if (hasReceivedNewMessages) {
      setHasNewMessages(true)
    }
  }, [activeRoomId, messages])

  useEffect(() => {
    if (typingProfiles.length > 0 && isAtBottomRef.current) {
      scrollToLatest()
    }
  }, [typingProfiles])

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

          void queryClient.invalidateQueries({
            queryKey: ['rooms', user?.id],
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeRoomId, queryClient])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const channel = supabase
      .channel(`room-list:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['rooms', user.id],
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const channel = supabase
      .channel(`room-list-attachments:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_attachments',
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['rooms', user.id],
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  useEffect(() => {
    if (!activeRoomId) {
      return
    }

    const channel = supabase
      .channel(`attachments:${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_attachments',
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['message-attachments'],
          })

          void queryClient.invalidateQueries({
            queryKey: ['rooms', user?.id],
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
    if (!user || !activeRoomId || !messages?.length || !isAtBottom) {
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
  }, [activeRoomId, isAtBottom, messages, user, markMessagesAsReadMutation])

 useEffect(() => {
  if (
    !activeRoomId ||
    isMessagesLoading ||
    !messages ||
    !shouldScrollToRoomBottomRef.current
  ) {
    return
  }

  const container = scrollContainerRef.current

  if (!container) {
    return
  }

  const scrollToRoomBottom = () => {
    if (!shouldScrollToRoomBottomRef.current) {
      return
    }

    container.scrollTop = container.scrollHeight

    isAtBottomRef.current = true
    setIsAtBottom(true)
    setHasNewMessages(false)
  }

  // Scroll to the bottom immediately after the messages render.
  requestAnimationFrame(scrollToRoomBottom)

  const resizeObserver = new ResizeObserver(() => {
    if (!shouldScrollToRoomBottomRef.current) {
      return
    }

    scrollToRoomBottom()
  })

  // Observe the actual message content rather than only the
  // scroll container's own dimensions.
  const content = container.firstElementChild

  if (content) {
    resizeObserver.observe(content)
  }

  // Also observe the container in case its dimensions change.
  resizeObserver.observe(container)

  // Give images and other async content enough time to finish
  // changing the message layout before ending initial positioning.
  const timeoutId = window.setTimeout(() => {
    shouldScrollToRoomBottomRef.current = false
  }, 2000)

  return () => {
    resizeObserver.disconnect()
    window.clearTimeout(timeoutId)
  }
}, [activeRoomId, isMessagesLoading, messages, messageAttachments])

  const selectedRoom = rooms?.find((room) => room.id === activeRoomId)

  async function handleCreateRoom() {
    if (!user || !roomName.trim()) {
      return
    }

    setRoomError(null)

    try {
      const createdRoom = await createRoomMutation.mutateAsync({
        name: roomName.trim(),
      })

      setRoomName('')
      setSelectedRoomId(createdRoom.id)
    } catch {
      setRoomError('The room could not be created. Please try again.')
    }
  }

  async function handleSendMessage() {
    const content = message.trim()

    if (
      !user ||
      !activeRoomId ||
      (!content && attachmentsToSend.length === 0)
    ) {
      return
    }

    // shouldScrollAfterAttachmentLoadRef.current = isAtBottomRef.current

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
      isAtBottomRef.current = true
      setIsAtBottom(true)
      scrollToLatest()
    } catch {
      setSendError('Your message could not be sent. Please try again.')

      return
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
    }

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

  return (
    <div className="grid h-[calc(100dvh-8rem)] min-h-[36rem] grid-cols-1 lg:h-[calc(100vh-10rem)] lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
      {/* Rooms */}
      <Card
        className={`h-full min-h-0 flex-col overflow-hidden ${
          isMobileRoomListOpen ? 'flex' : 'hidden'
        } lg:flex`}
      >
        <div className="border-b p-3 sm:p-4">
          <h2 className="text-lg font-semibold">Rooms</h2>

          <div className="mt-4 space-y-2">
            <Input
              placeholder="Room name..."
              aria-label="New room name"
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

            {roomError && (
              <p role="alert" className="text-sm text-red-600">
                {roomError}
              </p>
            )}
          </div>

        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {areRoomsLoading ? (
            <div className="space-y-2" aria-busy="true">
              <span className="sr-only">Loading rooms</span>
              {[1, 2, 3].map((room) => (
                <div
                  key={room}
                  className="h-14 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : areRoomsUnavailable ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              Rooms could not be loaded.
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => {
                  void refetchRooms()
                }}
              >
                Try again
              </Button>
            </div>
          ) : rooms?.length ? (
                <RoomList
                  rooms={rooms}
                  activeRoomId={activeRoomId}
                  currentUserId={user?.id ?? null}
                  onSelectRoom={(roomId) => {
                    setSelectedRoomId(roomId)
                    setIsMobileRoomListOpen(false)
                  }}
                />
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Create a room to start a conversation.
                </div>
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card
        className={`h-full min-h-0 flex-col overflow-hidden ${
          isMobileRoomListOpen ? 'hidden' : 'flex'
        } lg:flex`}
      >
        <div className="flex min-w-0 items-start gap-3 border-b p-3 sm:p-4">
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 lg:hidden"
            aria-label="Back to rooms"
            onClick={() => {
              setIsMobileRoomListOpen(true)
            }}
          >
            ←
          </Button>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">
              {selectedRoom?.name ??
                (activeRoomId ? 'Direct Message' : 'Select a room')}
            </h2>

          {!activeRoomId ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a room from the list, or create a new one.
            </p>
          ) : onlineRoomProfiles.length > 0 ? (
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
       </div>
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            role="log"
            aria-live="polite"
            aria-label="Messages"
            aria-busy={isMessagesLoading}
            className="h-full min-w-0 overflow-x-hidden overflow-y-auto p-3 sm:p-4"
          >
            {!activeRoomId ? (
              <div className="flex h-full items-center justify-center text-center">
                <p className="max-w-xs text-sm text-muted-foreground">
                  Your messages will appear here once you select a room.
                </p>
              </div>
            ) : isMessagesLoading ? (
              <div className="space-y-4" aria-hidden="true">
                <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-slate-100" />
                <div className="ml-auto h-20 w-2/3 animate-pulse rounded-2xl bg-slate-200" />
                <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-slate-100" />
                <span className="sr-only">Loading messages</span>
              </div>
            ) : areMessagesUnavailable ? (
              <div className="flex h-full items-center justify-center text-center">
                <div
                  role="alert"
                  className="max-w-sm rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <p>Messages could not be loaded.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => {
                      void refetchMessages()
                    }}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            ) : messages?.length ? (
              <div className="min-w-0 space-y-1">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user?.id
                  const senderProfile = messageProfilesById.get(
                    message.sender_id,
                  )
                  const senderName = senderProfile
                    ? getDisplayName(
                        senderProfile.full_name,
                        senderProfile.email,
                      )
                    : 'Unknown user'
                  const isSameSenderAsPrevious =
                    messages[index - 1]?.sender_id === message.sender_id
                  const shouldShowSender =
                    !isOwnMessage && !isSameSenderAsPrevious

                  return (
                    <div
                      key={message.id}
                      className={`flex min-w-0 ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      } ${isSameSenderAsPrevious ? 'mt-1' : 'mt-4 first:mt-0'}`}
                    >
                      <div
                        className={`min-w-0 max-w-[88%] rounded-2xl border px-3 py-2 sm:max-w-[75%] sm:px-4 sm:py-3 ${
                          isOwnMessage ? 'bg-blue-600 text-white' : 'bg-card'
                        }`}
                      >
                        {shouldShowSender && (
                          <p className="text-xs text-muted-foreground">
                            {senderName}
                          </p>
                        )}

                        {message.content && (
                          <p
                            className={`${
                              shouldShowSender ? 'mt-1' : ''
                            } break-words`}
                          >
                            {message.content}
                          </p>
                        )}

                        <AttachmentList
                          attachments={attachmentsByMessageId.get(message.id) ?? []}
                          isOwnMessage={isOwnMessage}
                        />

                        <div
                          className={`mt-1.5 flex items-center gap-2 text-xs ${
                            isOwnMessage
                              ? 'text-blue-100'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <span>
                            {new Date(message.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: 'numeric',
                                minute: '2-digit',
                              },
                            )}
                          </span>

                          {isOwnMessage && (
                            <span>{message.read_at ? 'Seen' : 'Sent'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="max-w-xs text-sm text-muted-foreground">
                  No messages yet. Say hello to start the conversation.
                </p>
              </div>
            )}

            {areAttachmentsUnavailable && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                Some attachments could not be loaded.
                <Button
                  type="button"
                  variant="secondary"
                  className="ml-3 px-3 py-1"
                  onClick={() => {
                    void refetchAttachments()
                  }}
                >
                  Try again
                </Button>
              </div>
            )}

            {!isMessagesLoading &&
              !areMessagesUnavailable &&
              typingProfiles.length > 0 && (
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

            <div ref={messagesEndRef} />
          </div>

          {hasNewMessages && (
            <Button
              type="button"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg"
              onClick={() => {
                isAtBottomRef.current = true
                setIsAtBottom(true)
                setHasNewMessages(false)
                scrollToLatest()
              }}
            >
              New messages ↓
            </Button>
          )}
        </div>

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
              onRemove={(index) => {
                setAttachmentsToSend((attachments) =>
                  attachments.filter(
                    (_, attachmentIndex) => attachmentIndex !== index,
                  ),
                )
                setAttachmentError(null)
              }}
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
      </Card>
    </div>
  )
}
