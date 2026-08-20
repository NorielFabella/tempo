import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { PresenceProvider } from '@/features/messaging/presence/providers/PresenceProvider'
import { Header } from '@/shared/components/layout/Header'
import { Sidebar } from '@/shared/components/layout/Sidebar'

export function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileSidebarOpen])

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileSidebarOpen])

  return (
    <PresenceProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex min-h-screen">
          <Sidebar
            isMobileOpen={isMobileSidebarOpen}
            onClose={() => {
              setIsMobileSidebarOpen(false)
            }}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <Header
              onMenuClick={() => {
                setIsMobileSidebarOpen(true)
              }}
            />

            <main className="flex-1 overflow-auto p-4 sm:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </PresenceProvider>
  )
}
