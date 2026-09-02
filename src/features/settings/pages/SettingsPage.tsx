import { Check, LogOut, Monitor, Moon, Sun } from 'lucide-react'

import { useTheme } from '@/app/providers/useTheme'
import { signOut } from '@/features/auth/services/auth.service'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'

const themeOptions = [
  {
    value: 'light' as const,
    label: 'Light',
    description: 'Use a light appearance.',
    icon: Sun,
  },
  {
    value: 'dark' as const,
    label: 'Dark',
    description: 'Use a dark appearance.',
    icon: Moon,
  },
  {
    value: 'system' as const,
    label: 'System',
    description: 'Follow your device preference.',
    icon: Monitor,
  },
]

export function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your Tempo preferences and account.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Appearance
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose how Tempo looks on your device.
          </p>
        </div>

        <Card className="divide-y divide-slate-200 dark:divide-slate-800">
          {themeOptions.map(({ value, label, description, icon: Icon }) => {
            const isSelected = theme === value

            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setTheme(value)
                }}
                className={[
                  'flex w-full items-center gap-4 p-4 text-left transition-colors',
                  'first:rounded-t-xl last:rounded-b-xl',
                  'hover:bg-slate-50 dark:hover:bg-slate-900',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  isSelected
                    ? 'bg-slate-50 dark:bg-slate-900'
                    : 'bg-transparent',
                ].join(' ')}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                </div>

                <div
                  className={[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-slate-300 dark:border-slate-600',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
              </button>
            )
          })}
        </Card>
      </section>



      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Session
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign out of your Tempo account on this device.
          </p>
        </div>

        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              Sign out
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You will need to sign in again to access Tempo.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            onClick={() => {
              void signOut()
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </Card>
      </section>
    </div>
  )
}
