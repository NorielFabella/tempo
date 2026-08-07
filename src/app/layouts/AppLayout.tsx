import { Outlet } from 'react-router-dom'

import { PresenceProvider } from '@/features/messaging/presence/providers/PresenceProvider'
import { Header } from '@/shared/components/layout/Header'
import { Sidebar } from '@/shared/components/layout/Sidebar'

export function AppLayout() {
  return (
    <PresenceProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          <Sidebar />

          <div className="flex flex-1 flex-col">
            <Header />

            <main className="flex-1 overflow-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </PresenceProvider>
  )
}
