import { Bell, Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { UserMenu } from '@/shared/components/layout/UserMenu'

type HeaderProps = {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

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
            </button>

            {isNotificationsOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Notifications
                  </h2>
                </div>

                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />

                  <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    No notifications yet
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    You're all caught up.
                  </p>
                </div>
              </div>
            )}
          </div>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
