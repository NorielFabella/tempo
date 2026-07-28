import { AuthCard } from '@/features/auth/components/AuthCard'
import { AuthHeader } from '@/features/auth/components/AuthHeader'
import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Welcome back"
        description="Sign in to continue to Tempo."
      />

      <LoginForm />
    </AuthCard>
  )
}
