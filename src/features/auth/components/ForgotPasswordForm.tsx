import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/forgotPasswordSchema'
import { resetPassword } from '@/features/auth/services/auth.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEventHandler } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Link } from 'react-router-dom'

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (values) => {
    setMessage(null)
    setErrorMessage(null)

    const { error } = await resetPassword(values.email)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setMessage('If an account exists, a reset email has been sent.')
  }

  const handleFormSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    void handleSubmit(onSubmit)(event)
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      style={{ display: 'grid', gap: '1rem' }}
    >
      <div>
        <label
          htmlFor="email"
          style={{ display: 'block', marginBottom: '0.35rem' }}
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          style={{ width: '100%', padding: '0.65rem 0.75rem' }}
        />

        {errors.email && (
          <p style={{ color: '#dc2626', marginTop: '0.35rem' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      {errorMessage && (
        <p style={{ color: '#dc2626' }}>
          {errorMessage}
        </p>
      )}

      {message && (
        <p>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ padding: '0.75rem 1rem' }}
      >
        {isSubmitting ? 'Sending...' : 'Send reset link'}
      </button>

      <p>
        <Link to="/login">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
