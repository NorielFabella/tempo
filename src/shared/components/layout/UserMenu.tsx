import { ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { signOut } from '@/features/auth/services/auth.service'
import { usePresence } from '@/features/messaging/presence/hooks/usePresence'
import { useProfile } from '@/features/profile/hooks/useProfile'

function getInitials(fullName: string | null | undefined, email: string) {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/)

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  }

  return email.charAt(0).toUpperCase()
}

export function UserMenu() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { onlineUserIds } = usePresence()

  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (!user) {
    return null
  }

  const email = user.email ?? ''
  const displayName = profile?.full_name?.trim() || 'Tempo User'
  const initials = getInitials(profile?.full_name, email)
  const isOnline = onlineUserIds.includes(user.id)

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open account menu"
        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={() => {
          setIsOpen((current) => !current)
        }}
      >
        <span className="relative block h-9 w-9 shrink-0">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
              {initials}
            </span>
          )}

          <span
            aria-hidden="true"
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950 ${
              isOnline ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
        </span>

        <span className="hidden max-w-40 text-left sm:block">
          <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {displayName}
          </span>

          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </span>

        <ChevronDown
          className={`hidden h-4 w-4 text-slate-500 transition-transform dark:text-slate-400 sm:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="relative block h-10 w-10 shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
                    {initials}
                  </span>
                )}

                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {displayName}
                </p>

                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {email}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-1.5 dark:border-slate-800">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              onClick={() => {
                void handleSignOut()
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
