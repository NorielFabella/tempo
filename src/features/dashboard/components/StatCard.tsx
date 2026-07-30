import type { ReactNode } from 'react'

import { Card } from '@/shared/components/ui/Card'

type StatCardProps = {
  title: string
  value: string | number
  icon?: ReactNode
}

export function StatCard({
  title,
  value,
  icon,
}: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {value}
          </h2>
        </div>

        {icon && (
          <div className="text-slate-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
