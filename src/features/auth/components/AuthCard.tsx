import { Card } from '@/shared/components/ui/Card'
import type { PropsWithChildren } from 'react'

type AuthCardProps = PropsWithChildren

export function AuthCard({ children }: AuthCardProps) {
  return (
    <Card
      className="w-full max-w-md p-6"
    >
      {children}
    </Card>
  )
}
