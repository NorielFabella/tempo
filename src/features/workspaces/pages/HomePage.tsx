import { MessageSquare, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { QuickActions } from '@/features/dashboard/components/QuickActions'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { usePresence } from '@/features/messaging/presence/hooks/usePresence'
import { useRooms } from '@/features/messaging/rooms/hooks/useRooms'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'

export function HomePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const { data: rooms = [], isLoading: areRoomsLoading } = useRooms(
    profile?.id,
  )
  const { onlineUserIds } = usePresence()

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading your workspace...
        </p>
      </div>
    )
  }

  const roomCount = rooms.length
  const onlineUserCount = Math.max(onlineUserIds.length - 1, 0)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardHeader
        title={`Welcome back${
          profile?.full_name
            ? `, ${profile.full_name.split(' ')[0]}`
            : ''
        }!`}
        // description="Here's what's happening in your workspace."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Chats"
          value={areRoomsLoading ? '...' : roomCount}
          icon={<MessageSquare className="h-7 w-7" />}
        />

        <StatCard
          title="Online"
          value={onlineUserCount}
          icon={<Users className="h-7 w-7" />}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Quick Actions
        </h2>

        <QuickActions />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Recent Chats
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {/* Jump back into one of your chats. */}
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void navigate('/app/chat')
            }}
          >
            View all
          </Button>
        </div>

        {areRoomsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3].map((item) => (
              <Card
                key={item}
                className="h-20 animate-pulse bg-slate-100 dark:bg-slate-800"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : rooms.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {rooms.slice(0, 4).map((room) => (
              <button
                key={room.id}
                type="button"
                className="text-left"
                onClick={() => {
                  void navigate('/app/chat')
                }}
              >
                <Card className="p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <MessageSquare className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {room.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Open conversation
                      </p>
                    </div>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />

            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
              No conversations yet
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Create a room or start a conversation to get your Tempo
              workspace going.
            </p>

            <Button
              type="button"
              className="mt-5"
              onClick={() => {
                void navigate('/app/chat')
              }}
            >
              Open Chat
            </Button>
          </Card>
        )}
      </section>
    </div>
  )
}
