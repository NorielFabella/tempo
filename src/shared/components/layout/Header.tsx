import { Bell, Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { NotificationBadge } from '@/features/notifications/components/NotificationBadge'
import { NotificationCenter } from '@/features/notifications/components/NotificationCenter'
import { useNotificationRealtime } from '@/features/notifications/hooks/useNotificationRealtime'
import { useUnreadNotificationCount } from '@/features/notifications/hooks/useUnreadNotificationCount'
import { UserMenu } from '@/shared/components/layout/UserMenu'

type HeaderProps = {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const { data: unreadCount = 0 } = useUnreadNotificationCount()

  useNotificationRealtime()

  useEffect(() => {
    if (!isNotificationsOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNotificationsOpen])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Tempo
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded={isNotificationsOpen}
              className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={() => {
                setIsNotificationsOpen((current) => !current)
              }}
            >
              <Bell className="h-5 w-5" />
              <NotificationBadge count={unreadCount} />
            </button>

            {isNotificationsOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <NotificationCenter
                  onClose={() => {
                    setIsNotificationsOpen(false)
                  }}
                />
              </div>
            )}
          </div>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
