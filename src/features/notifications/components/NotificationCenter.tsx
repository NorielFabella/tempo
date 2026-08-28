import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useProfiles } from '@/features/profile/hooks/useProfiles'
import { Button } from '@/shared/components/ui/Button'

import { useMarkAllNotificationsRead } from '../hooks/useMarkAllNotificationsRead'
import { useMarkNotificationRead } from '../hooks/useMarkNotificationRead'
import { useNotifications } from '../hooks/useNotifications'
import { useUnreadNotificationCount } from '../hooks/useUnreadNotificationCount'
import { NotificationItem } from './NotificationItem'

type NotificationCenterProps = {
  onClose: () => void
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const navigate = useNavigate()
  const notificationsQuery = useNotifications()
  const unreadCountQuery = useUnreadNotificationCount()
  const markNotificationReadMutation = useMarkNotificationRead()
  const markAllNotificationsReadMutation = useMarkAllNotificationsRead()
  const notifications = notificationsQuery.data ?? []
  const actorIds = [
    ...new Set(
      notifications
        .map((notification) => notification.actor_id)
        .filter((actorId): actorId is string => Boolean(actorId)),
    ),
  ]
  const { data: actors = [] } = useProfiles(actorIds)
  const actorsById = new Map(actors.map((actor) => [actor.id, actor]))
  const unreadCount = unreadCountQuery.data ?? 0

  const handleNotificationClick = (notification: (typeof notifications)[number]) => {
    onClose()

    if (notification.room_id) {
      void navigate('/app/chat', {
        state: { targetRoomId: notification.room_id },
      })
    }

    if (!notification.read_at) {
      void markNotificationReadMutation.mutateAsync(notification.id)
    }
  }

  if (notificationsQuery.isLoading) {
    return (
      <>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Notifications
          </h2>
        </div>

        <div className="space-y-2 p-3" aria-busy="true">
          <span className="sr-only">Loading notifications</span>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      </>
    )
  }

  if (notificationsQuery.isError) {
    return (
      <>
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Notifications
          </h2>
        </div>

        <div className="px-4 py-8 text-center">
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Notifications could not be loaded.
          </p>

          <Button
            type="button"
            variant="secondary"
            className="mt-3 px-3 py-1.5 text-xs"
            onClick={() => {
              void notificationsQuery.refetch()
            }}
          >
            Try again
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Notifications
        </h2>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => {
              void markAllNotificationsReadMutation.mutateAsync()
            }}
            disabled={markAllNotificationsReadMutation.isPending}
          >
            {markAllNotificationsReadMutation.isPending
              ? 'Marking...'
              : 'Mark all as read'}
          </Button>
        )}
      </div>

      {unreadCountQuery.isError && (
        <p
          role="alert"
          className="border-b border-slate-200 px-4 py-2 text-xs text-amber-700 dark:border-slate-800 dark:text-amber-400"
        >
          Unread count is unavailable. Please try again later.
        </p>
      )}

      {markAllNotificationsReadMutation.isError && (
        <p
          role="alert"
          className="border-b border-slate-200 px-4 py-2 text-xs text-red-600 dark:border-slate-800 dark:text-red-400"
        >
          Notifications could not be marked as read.
        </p>
      )}

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Bell className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />

          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            No notifications yet
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            You're all caught up.
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto py-1">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              actor={
                notification.actor_id
                  ? actorsById.get(notification.actor_id)
                  : undefined
              }
              onClick={handleNotificationClick}
              isReadPending={
                markNotificationReadMutation.isPending &&
                markNotificationReadMutation.variables === notification.id
              }
            />
          ))}
        </div>
      )}

      {markNotificationReadMutation.isError && (
        <p
          role="alert"
          className="border-t border-slate-200 px-4 py-2 text-xs text-red-600 dark:border-slate-800 dark:text-red-400"
        >
          Notification could not be marked as read.
        </p>
      )}
    </>
  )
}
