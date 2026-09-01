import { Globe } from 'lucide-react'

import { PasswordField } from '@/features/auth/components/PasswordField'
import {
    loginSchema,
    type LoginFormValues,
} from '@/features/auth/schemas/loginSchema'
import {
    signIn,
    signInWithGoogle,
} from '@/features/auth/services/auth.service'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEvent } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Link } from 'react-router-dom'

export function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

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
      return
    }
  }

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event)
  }

  const handleGoogleSignIn = async () => {
    setErrorMessage(null)
    setIsGoogleLoading(true)

    const { error } = await signInWithGoogle()

    if (error) {
      setErrorMessage(error.message)
      setIsGoogleLoading(false)
    }
  }

  return (
    <form onSubmit={handleFormSubmit} style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <label
          htmlFor="email"
          style={{ display: 'block', marginBottom: '0.35rem' }}
        >
          Email
        </label>

        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
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

      {errorMessage && <p style={{ color: '#dc2626' }}>{errorMessage}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>

      <Button
        type="button"
        variant="secondary"
        disabled={isSubmitting || isGoogleLoading}
        onClick={() => {
          void handleGoogleSignIn()
        }}
      >
        <Globe className="mr-2 h-4 w-4" aria-hidden="true" />
        {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
      </Button>

      <p>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>

      <p>
        Don&apos;t have an account?{' '}
        <Link to="/register" style={{ fontWeight: 500 }}>
          Create one
        </Link>
      </p>
    </form>
  )
}
