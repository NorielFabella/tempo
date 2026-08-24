import type { RoomWithMetadata } from '../types/room'

type RoomListProps = {
  rooms: RoomWithMetadata[]
  activeRoomId: string | null
  currentUserId: string | null
  onSelectRoom: (roomId: string) => void
}

function formatActivityTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()

  const diffMs = Math.max(0, now.getTime() - date.getTime())
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}h`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  if (diffHours < 24 * 7) {
    return date.toLocaleDateString([], {
      weekday: 'short',
    })
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function getMessagePreview(room: RoomWithMetadata, currentUserId: string | null) {
  const latestMessage = room.latest_message

  if (!latestMessage) {
    return 'No messages yet'
  }

  const senderName = latestMessage.sender_name?.trim().split(/\s+/)[0]

  const senderPrefix =
    latestMessage.sender_id === currentUserId
      ? 'You: '
      : senderName
        ? `${senderName}: `
        : ''

  if (latestMessage.content.trim()) {
    return `${senderPrefix}${latestMessage.content}`
  }

  if (latestMessage.has_attachments) {
    return `${senderPrefix}📎 Attachment`
  }

  return `${senderPrefix}No content`
}

export function RoomList({
  rooms,
  activeRoomId,
  currentUserId,
  onSelectRoom,
}: RoomListProps) {
  if (!rooms.length) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Create a room to start a conversation.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {rooms.map((room) => {
        const isActive = room.id === activeRoomId
        const hasUnreadMessages = room.unread_count > 0
        const latestMessage = room.latest_message

        return (
          <button
            key={room.id}
            type="button"
            onClick={() => {
              onSelectRoom(room.id)
            }}
            aria-pressed={isActive}
            className={`w-full rounded-lg px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-950'
                : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`truncate ${
                      hasUnreadMessages ? 'font-semibold' : 'font-medium'
                    }`}
                  >
                    {room.name ?? room.other_user_name ?? 'Direct Message'}
                  </p>

                  {latestMessage && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatActivityTimestamp(latestMessage.created_at)}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <p
                    className={`min-w-0 flex-1 truncate text-sm ${
                      hasUnreadMessages
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {getMessagePreview(room, currentUserId)}
                  </p>

                  {hasUnreadMessages && (
                    <span
                      aria-label={`${room.unread_count} unread ${
                        room.unread_count === 1 ? 'message' : 'messages'
                      }`}
                      className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white"
                    >
                      {room.unread_count > 99 ? '99+' : room.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
