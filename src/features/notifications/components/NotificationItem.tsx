import { MessageSquare, Users } from 'lucide-react'

import type { Profile } from '@/features/profile/types/profile'
import { Avatar } from '@/shared/components/ui/Avatar'

import type { Notification } from '../types/notification'

type NotificationItemProps = {
  notification: Notification
  actor: Profile | undefined
  onClick: (notification: Notification) => void
  isReadPending: boolean
}

function getActorName(actor: Profile | undefined) {
  return actor?.full_name?.trim() || actor?.email || 'Someone'
}

function getActorInitials(actor: Profile | undefined) {
  const name = actor?.full_name?.trim()

  if (!name) {
    return actor?.email?.charAt(0).toUpperCase() || 'S'
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function formatRelativeTime(createdAt: string) {
  const createdDate = new Date(createdAt)
  const now = new Date()
  const diffMs = Math.max(0, now.getTime() - createdDate.getTime())
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (createdDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return createdDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

export function NotificationItem({
  notification,
  actor,
  onClick,
  isReadPending,
}: NotificationItemProps) {
  const actorName = getActorName(actor)
  const isNewMessage = notification.type === 'new_message'
  const message = isNewMessage
    ? `${actorName} sent you a message`
    : `${actorName} added you to a group`
  const Icon = isNewMessage ? MessageSquare : Users

  return (
    <button
      type="button"
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 dark:hover:bg-slate-800 ${
        notification.read_at
          ? ''
          : 'bg-blue-50/70 dark:bg-blue-950/30'
      }`}
      disabled={isReadPending}
      aria-label={`${message}, ${formatRelativeTime(notification.created_at)}`}
      onClick={() => {
        onClick(notification)
      }}
    >
      <Avatar
        imageUrl={actor?.avatar_url}
        fallback={getActorInitials(actor)}
        alt=""
        size="sm"
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span
            className={`min-w-0 flex-1 break-words text-sm ${
              notification.read_at
                ? 'font-medium text-slate-700 dark:text-slate-300'
                : 'font-semibold text-slate-900 dark:text-slate-100'
            }`}
          >
            {message}
          </span>

          {!notification.read_at && (
            <span
              aria-hidden="true"
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600"
            />
          )}
        </span>

        <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {formatRelativeTime(notification.created_at)}
        </span>
      </span>
    </button>
  )
}
