import { PasswordField } from '@/features/auth/components/PasswordField'
import {
  registerSchema,
  type RegisterFormValues,
} from '@/features/auth/schemas/registerSchema'
import { signUp } from '@/features/auth/services/auth.service'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEventHandler } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Link } from 'react-router-dom'

export function RegisterForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    setErrorMessage(null)

    const { error } = await signUp(
      values.email,
      values.password,
      values.fullName,
    )

    if (error) {
      setErrorMessage(error.message)
      return
    }
  }

  const handleFormSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    void handleSubmit(onSubmit)(event)
  }

  return (
    <form onSubmit={handleFormSubmit} style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <label
          htmlFor="fullName"
          style={{ display: 'block', marginBottom: '0.35rem' }}
        >
          Full name
        </label>

        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          {...register('fullName')}
        />

        {errors.fullName && (
          <p style={{ color: '#dc2626', marginTop: '0.35rem' }}>
            {errors.fullName.message}
          </p>
        )}
      </div>

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
          placeholder="you@example.com"
          {...register('email')}
        />

        {errors.email && (
          <p style={{ color: '#dc2626', marginTop: '0.35rem' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      <PasswordField
        id="password"
        label="Password"
        autoComplete="new-password"
        register={register('password')}
        error={errors.password}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        register={register('confirmPassword')}
        error={errors.confirmPassword}
      />

      {errorMessage && <p style={{ color: '#dc2626' }}>{errorMessage}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>

      <p>
        <Link to="/login">Already have an account? Sign in</Link>
      </p>
    </form>
  )
}
