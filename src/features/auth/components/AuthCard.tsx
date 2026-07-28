import type { PropsWithChildren } from 'react'

type AuthCardProps = PropsWithChildren

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '24rem',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        backgroundColor: '#fff',
      }}
    >
      {children}
    </div>
  )
}
