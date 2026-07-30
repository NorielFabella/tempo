import {
  Activity,
  FolderKanban,
  MessageSquare,
  Users,
} from 'lucide-react'

import { signOut } from '@/features/auth/services/auth.service'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { QuickActions } from '@/features/dashboard/components/QuickActions'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { Button } from '@/shared/components/ui/Button'

export function HomePage() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Welcome back!"
        description={`Signed in as ${profile?.email ?? 'Unknown user'}`}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              void signOut()
            }}
          >
            Sign Out
          </Button>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Projects"
          value="12"
          icon={<FolderKanban className="h-8 w-8" />}
        />

        <StatCard
          title="Messages"
          value="84"
          icon={<MessageSquare className="h-8 w-8" />}
        />

        <StatCard
          title="Team Members"
          value="8"
          icon={<Users className="h-8 w-8" />}
        />

        <StatCard
          title="Activity"
          value="23"
          icon={<Activity className="h-8 w-8" />}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Quick Actions
        </h2>

        <QuickActions />
      </section>
    </div>
  )
}
