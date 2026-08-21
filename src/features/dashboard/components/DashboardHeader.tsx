import type { ReactNode } from 'react'

type DashboardHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function DashboardHeader({
  title,
  description,
  actions,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>

        {description && (
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {actions}
    </div>
  )
}
