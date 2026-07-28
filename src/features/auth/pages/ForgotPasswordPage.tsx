import { AuthCard } from '@/features/auth/components/AuthCard'
import { AuthHeader } from '@/features/auth/components/AuthHeader'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Reset your password"
        description="Enter your email and we'll send you a reset link."
      />

      <ForgotPasswordForm />
    </AuthCard>
  )
}
