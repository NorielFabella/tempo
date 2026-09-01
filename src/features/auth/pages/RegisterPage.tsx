import { AuthCard } from '@/features/auth/components/AuthCard'
import { AuthHeader } from '@/features/auth/components/AuthHeader'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export function RegisterPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Create your account"
        description="Join Tempo and start collaborating."
      />

      <RegisterForm />
    </AuthCard>
  )
}
