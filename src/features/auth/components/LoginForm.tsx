import { PasswordField } from '@/features/auth/components/PasswordField'
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/loginSchema'
import { signIn } from '@/features/auth/services/auth.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEvent } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Link } from 'react-router-dom'

export function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    setErrorMessage(null)

    const { error } = await signIn(values.email, values.password)

    if (error) {
      setErrorMessage(error.message)
    }
  }

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
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
          style={{
            width: '100%',
            padding: '0.65rem 0.75rem',
          }}
        />

        {errors.email && (
          <p
            style={{
              color: '#dc2626',
              marginTop: '0.35rem',
            }}
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        register={register('password')}
        error={errors.password}
      />

      {errorMessage && (
        <p style={{ color: '#dc2626' }}>
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '0.75rem 1rem',
        }}
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>

      <p>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </form>
  )
}
