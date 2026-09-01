import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useChatActivity } from '@/features/messaging/activity/hooks/useChatActivity'
import { AttachmentList } from '@/features/messaging/attachments/components/AttachmentList'
import { useMessageAttachments } from '@/features/messaging/attachments/hooks/useMessageAttachments'
import { useDeleteMessage } from '@/features/messaging/chat/hooks/useDeleteMessage'
import { useEditMessage } from '@/features/messaging/chat/hooks/useEditMessage'
import { useMarkMessagesAsRead } from '@/features/messaging/chat/hooks/useMarkMessagesAsRead'
import { useMessages } from '@/features/messaging/chat/hooks/useMessages'
import { useTyping } from '@/features/messaging/chat/hooks/useTyping'
import { usePresence } from '@/features/messaging/presence/hooks/usePresence'
import { AddRoomMembers } from '@/features/messaging/rooms/components/AddRoomMembers'
import { DeleteRoomModal } from '@/features/messaging/rooms/components/DeleteRoomModal'
import { EditRoomModal } from '@/features/messaging/rooms/components/EditRoomModal'
import { RoomList } from '@/features/messaging/rooms/components/RoomList'
import { useCreateDirectRoom } from '@/features/messaging/rooms/hooks/useCreateDirectRoom'
import { useCreateRoom } from '@/features/messaging/rooms/hooks/useCreateRoom'
import { useRoomMembers } from '@/features/messaging/rooms/hooks/useRoomMembers'
import { useRooms } from '@/features/messaging/rooms/hooks/useRooms'
import { getRoomInitials } from '@/features/messaging/rooms/types/room'
import { ProfileSearch } from '@/features/profile/components/ProfileSearch'
import { useProfiles } from '@/features/profile/hooks/useProfiles'
import type { ProfileSearchResult } from '@/features/profile/types/profile'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { supabase } from '@/shared/supabase/client'
import { MessageComposer } from '../components/MessageComposer'
import type { Message } from '../types/message'

function getDisplayName(fullName: string | null, email: string) {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0]
  }

  return email
}

function getProfileInitials(fullName: string | null, email: string) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? []

  if (parts.length > 0) {
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }

  return email.charAt(0).toUpperCase() || 'U'
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

type ChatLocationState = {
  targetRoomId?: string
}

export function ChatPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  useChatActivity()

  const userId = user?.id
  const {
    data: rooms,
    isLoading: areRoomsLoading,
    isError: areRoomsUnavailable,
    refetch: refetchRooms,
  } = useRooms(user?.id)
  const createRoomMutation = useCreateRoom()
  const createDirectRoomMutation = useCreateDirectRoom()
  const deleteMessageMutation = useDeleteMessage()
  const editMessageMutation = useEditMessage()


  const markMessagesAsReadMutation = useMarkMessagesAsRead()
  const queryClient = useQueryClient()

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [isMobileRoomListOpen, setIsMobileRoomListOpen] = useState(true)
  const [roomName, setRoomName] = useState('')
  const [roomError, setRoomError] = useState<string | null>(null)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const previousRoomIdRef = useRef<string | null>(null)
  const previousMessageIdsRef = useRef<string[]>([])
  const shouldScrollToRoomBottomRef = useRef(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const messageMenuRef = useRef<HTMLDivElement>(null)
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false)
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [isDeleteRoomOpen, setIsDeleteRoomOpen] = useState(false)
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false)
  const roomMenuRef = useRef<HTMLDivElement>(null)
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [directMessageError, setDirectMessageError] = useState<string | null>(null)

  const targetRoomId = (location.state as ChatLocationState | null)?.targetRoomId

  const isSelectedRoomValid = rooms?.some((room) => room.id === selectedRoomId)
  const isTargetRoomValid = rooms?.some((room) => room.id === targetRoomId)
  const activeRoomId =
    (isTargetRoomValid ? targetRoomId : null) ??
    (isSelectedRoomValid ? selectedRoomId : null) ??
    rooms?.[0]?.id ??
    null

  useEffect(() => {
    if (!targetRoomId || !rooms) {
      return
    }

    void navigate('/app/chat', { replace: true, state: null })
  }, [navigate, rooms, targetRoomId])

  const {
    data: messages,
    isLoading: isMessagesLoading,
    isError: areMessagesUnavailable,
    refetch: refetchMessages,
  } = useMessages(activeRoomId ?? '')

  const { data: typingUsers } = useTyping(activeRoomId ?? '')

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

  const {
    data: messageProfiles = [],
  } = useProfiles(messageSenderIds)

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

  const { data: otherRoomProfiles = [] } = useProfiles(otherRoomMemberIds)

  const directMessageProfile = useMemo(
    () => otherRoomProfiles[0] ?? null,
    [otherRoomProfiles],
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
    if (!isRoomMenuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        roomMenuRef.current &&
        !roomMenuRef.current.contains(event.target as Node)
      ) {
        setIsRoomMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRoomMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRoomMenuOpen])

  useEffect(() => {
    if (!openMessageMenuId) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        messageMenuRef.current &&
        !messageMenuRef.current.contains(event.target as Node)
      ) {
        setOpenMessageMenuId(null)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMessageMenuId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMessageMenuId])

  useEffect(() => {
    if (activeRoomId !== previousRoomIdRef.current) {
      previousRoomIdRef.current = activeRoomId
      previousMessageIdsRef.current = []

      isAtBottomRef.current = true
      setIsAtBottom(true)
      setHasNewMessages(false)

      shouldScrollToRoomBottomRef.current = true
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
      .channel(`tempo:room:${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<Message[]>(
              ['messages', activeRoomId],
              (currentMessages) =>
                currentMessages?.filter(
                  (message) => message.id !== payload.old.id,
                ) ?? [],
            )
          } else {
            void queryClient.invalidateQueries({
              queryKey: ['messages', activeRoomId],
            })
          }

          void queryClient.invalidateQueries({
            queryKey: ['rooms', userId],
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${activeRoomId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['room-members', activeRoomId],
          })

          void queryClient.invalidateQueries({
            queryKey: ['rooms', userId],
          })
        },
      )
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
            queryKey: ['rooms', userId],
          })
        },
      )
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
  }, [activeRoomId, queryClient, userId])

  useEffect(() => {
  if (!user?.id) {
    return
  }

    const channel = supabase
      .channel(`tempo:room-list:${user.id}`)
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['profiles'],
          })

          void queryClient.invalidateQueries({
            queryKey: ['profile'],
          })

          void queryClient.invalidateQueries({
            queryKey: ['rooms', user.id],
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['rooms', user.id],
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['rooms', user.id],
          })
        },
      )
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
    const container = scrollContainerRef.current
    const isChatVisible = (container?.getClientRects().length ?? 0) > 0

    if (
      !userId ||
      !activeRoomId ||
      !messages?.length ||
      !isAtBottom ||
      !isChatVisible
    ) {
      return
    }

    const hasUnreadMessages = messages.some(
      (message) => message.sender_id !== userId && message.read_at === null,
    )

    if (!hasUnreadMessages) {
      return
    }

    if (!markMessagesAsReadMutation.isPending) {
      void markMessagesAsReadMutation.mutate({
        roomId: activeRoomId,
        userId,
      })
    }
  }, [
    activeRoomId,
    isAtBottom,
    messages,
    userId,
    markMessagesAsReadMutation,
    isMobileRoomListOpen,
  ])

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
  }, 3000)

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

  async function handleStartDirectMessage(profile: ProfileSearchResult) {
    if (!user) {
      return
    }

    setDirectMessageError(null)

    try {
      const roomId = await createDirectRoomMutation.mutateAsync(profile.id)

      await queryClient.invalidateQueries({
        queryKey: ['rooms', user.id],
      })

      setSelectedRoomId(roomId)
      setIsNewMessageOpen(false)
      setIsMobileRoomListOpen(false)
    } catch {
      setDirectMessageError(
        'The conversation could not be opened. Please try again.',
      )
    }
  }

  async function handleEditMessage(messageId: string) {
    const content = editingContent.trim()

    if (!user || !activeRoomId || !content) {
      return
    }

    setEditError(null)

    try {
      await editMessageMutation.mutateAsync({
        messageId,
        roomId: activeRoomId,
        userId: user.id,
        content,
      })

      setEditingMessageId(null)
      setEditingContent('')
      setOpenMessageMenuId(null)
    } catch {
      setEditError('The message could not be edited. Please try again.')
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
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setDirectMessageError(null)
                setIsNewMessageOpen(true)
              }}
            >
              New Message
            </Button>

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
                    setIsRoomMenuOpen(false)
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

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">
              {selectedRoom?.is_group
                ? selectedRoom.name
                : activeRoomId
                  ? directMessageProfile?.full_name?.trim() || 'Direct Message'
                  : 'Select a room'}
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
        {activeRoomId && selectedRoom?.is_group && (
          <Avatar
            imageUrl={selectedRoom.avatar_url}
            fallback={getRoomInitials(selectedRoom.name)}
            alt=""
            size="sm"
            cacheKey={`${selectedRoom.id}:${selectedRoom.avatar_url ?? ''}`}
          />
        )}
        {activeRoomId &&
          selectedRoom &&
          !selectedRoom.is_group &&
          directMessageProfile && (
            <Avatar
              imageUrl={directMessageProfile.avatar_url}
              fallback={getProfileInitials(
                directMessageProfile.full_name,
                directMessageProfile.email,
              )}
              alt=""
              size="sm"
              cacheKey={`${directMessageProfile.id}:${directMessageProfile.avatar_url ?? ''}`}
            />
          )}
        {activeRoomId && selectedRoom && (
          <div className="relative shrink-0" ref={roomMenuRef}>
            <button
              type="button"
              aria-label="Room actions"
              aria-expanded={isRoomMenuOpen}
              className="shrink-0 rounded-lg px-2.5 py-2 text-lg leading-none text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                setIsRoomMenuOpen((current) => !current)
              }}
            >
              ⋮
            </button>

            {isRoomMenuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-36 rounded-lg border bg-background p-1 text-foreground shadow-lg">
                {selectedRoom.is_group && (
                  <>
                    <button
                      type="button"
                      className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setIsRoomMenuOpen(false)
                        setIsEditRoomOpen(true)
                      }}
                    >
                      Edit room
                    </button>
                    <button
                      type="button"
                      className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setIsRoomMenuOpen(false)
                        setIsAddMembersOpen(true)
                      }}
                    >
                      Add members
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  onClick={() => {
                    setIsRoomMenuOpen(false)
                    setIsDeleteRoomOpen(true)
                  }}
                >
                  {selectedRoom.is_group ? 'Delete room' : 'Delete Conversation'}
                </button>
              </div>
            )}
          </div>
        )}

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
                  const senderAvatarFallback = senderProfile
                    ? getProfileInitials(
                        senderProfile.full_name,
                        senderProfile.email,
                      )
                    : 'U'
                  const senderAvatarCacheKey = senderProfile
                    ? `${senderProfile.id}:${senderProfile.avatar_url ?? ''}`
                    : undefined
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
                        className={`flex min-w-0 items-end gap-2 ${
                          isOwnMessage ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar
                          imageUrl={senderProfile?.avatar_url}
                          fallback={senderAvatarFallback}
                          alt=""
                          size="sm"
                          cacheKey={senderAvatarCacheKey}
                        />

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

                        {editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={(event) => {
                                setEditingContent(event.target.value)
                              }}
                              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                              rows={3}
                              autoFocus
                              aria-label="Edit message"
                              onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                  setEditingMessageId(null)
                                  setEditingContent('')
                                  setEditError(null)
                                }

                                if (event.key === 'Enter' && !event.shiftKey) {
                                  event.preventDefault()
                                  void handleEditMessage(message.id)
                                }
                              }}
                            />

                            {editError && (
                              <p role="alert" className="text-xs text-red-500">
                                {editError}
                              </p>
                            )}

                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                className="text-xs font-medium underline-offset-2 hover:underline"
                                onClick={() => {
                                  setEditingMessageId(null)
                                  setEditingContent('')
                                  setEditError(null)
                                }}
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                className="text-xs font-medium underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={
                                  editMessageMutation.isPending || !editingContent.trim()
                                }
                                onClick={() => {
                                  void handleEditMessage(message.id)
                                }}
                              >
                                {editMessageMutation.isPending ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          message.content && (
                            <p
                              className={`${
                                shouldShowSender ? 'mt-1' : ''
                              } break-words`}
                            >
                              {message.content}
                            </p>
                          )
                        )}

                        <AttachmentList
                          attachments={attachmentsByMessageId.get(message.id) ?? []}
                          isOwnMessage={isOwnMessage}
                        />

                        <div
                          className={`mt-1.5 flex items-center gap-2 text-xs ${
                            isOwnMessage ? 'text-blue-100' : 'text-muted-foreground'
                          }`}
                        >
                          <span>
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>

                          {message.updated_at !== message.created_at && (
                            <span>Edited</span>
                          )}

                          {isOwnMessage && editingMessageId !== message.id && (
                            <>
                              <span>{message.read_at ? 'Seen' : 'Sent'}</span>

                              <div
                                className="relative ml-auto"
                                ref={
                                  openMessageMenuId === message.id
                                    ? messageMenuRef
                                    : undefined
                                }
                              >
                                <button
                                  type="button"
                                  className="rounded px-1.5 py-0.5 font-medium hover:bg-black/10"
                                  aria-label="Message actions"
                                  aria-expanded={openMessageMenuId === message.id}
                                  onClick={() => {
                                    setOpenMessageMenuId((current) =>
                                      current === message.id ? null : message.id,
                                    )
                                  }}
                                >
                                  ⋮
                                </button>

                                {openMessageMenuId === message.id && (
                                  <div className="absolute bottom-full right-0 z-10 mb-1 min-w-28 rounded-lg border bg-background p-1 text-foreground shadow-lg">
                                    <button
                                      type="button"
                                      className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                      onClick={() => {
                                        setEditingMessageId(message.id)
                                        setEditingContent(message.content)
                                        setOpenMessageMenuId(null)
                                        setEditError(null)
                                      }}
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                      disabled={deleteMessageMutation.isPending}
                                      onClick={() => {
                                        setOpenMessageMenuId(null)

                                        void deleteMessageMutation.mutateAsync({
                                          messageId: message.id,
                                          roomId: activeRoomId,
                                          userId: user.id,
                                        })
                                      }}
                                    >
                                      {deleteMessageMutation.isPending ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}


                        </div>
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

        <MessageComposer
          activeRoomId={activeRoomId}
          onMessageSent={() => {
            isAtBottomRef.current = true
            setIsAtBottom(true)
            scrollToLatest()
          }}
        />
          </Card>

        <Modal
          open={isAddMembersOpen}
          title="Add members"
          onClose={() => {
            setIsAddMembersOpen(false)
          }}
        >
          {activeRoomId && (
            <AddRoomMembers
              roomId={activeRoomId}
              currentUserId={user?.id ?? ''}
              memberIds={roomMemberIds}
            />
          )}
        </Modal>

        <EditRoomModal
          open={isEditRoomOpen}
          room={selectedRoom ?? null}
          userId={user?.id ?? ''}
          onClose={() => {
            setIsEditRoomOpen(false)
          }}
        />

        <DeleteRoomModal
          open={isDeleteRoomOpen}
          room={selectedRoom ?? null}
          userId={user?.id ?? ''}
          onClose={() => {
            setIsDeleteRoomOpen(false)
          }}
          onDeleted={(deletedRoomId) => {
            const isMobile =
              typeof window !== 'undefined' &&
              !window.matchMedia('(min-width: 1024px)').matches

            if (isMobile) {
              setSelectedRoomId(null)
              setIsMobileRoomListOpen(true)
            } else {
              const remainingRooms = (rooms ?? []).filter(
                (room) => room.id !== deletedRoomId,
              )
              setSelectedRoomId(remainingRooms[0]?.id ?? null)
            }
          }}
        />

        <Modal
          open={isNewMessageOpen}
          title="New message"
          onClose={() => {
            setIsNewMessageOpen(false)
            setDirectMessageError(null)
          }}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Start a conversation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search for someone to start a direct conversation with.
              </p>
            </div>

            <ProfileSearch
              excludeUserIds={user?.id ? [user.id] : []}
              onSelectProfile={(profile) => {
                void handleStartDirectMessage(profile)
              }}
            />

            {createDirectRoomMutation.isPending && (
              <p className="text-sm text-muted-foreground">
                Opening conversation...
              </p>
            )}

            {directMessageError && (
              <p role="alert" className="text-sm text-red-600">
                {directMessageError}
              </p>
            )}
          </div>
        </Modal>
      </div>
    )
}
