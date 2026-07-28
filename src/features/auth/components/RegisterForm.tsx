import { PasswordField } from '@/features/auth/components/PasswordField'
import {
  registerSchema,
  type RegisterFormValues,
} from '@/features/auth/schemas/registerSchema'
import { signUp } from '@/features/auth/services/auth.service'
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
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    setErrorMessage(null)

    const { error } = await signUp(values.email, values.password)

    if (error) {
      setErrorMessage(error.message)
    }
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

      {errorMessage && (
        <p style={{ color: '#dc2626' }}>
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ padding: '0.75rem 1rem' }}
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>

      <p>
        <Link to="/login">
          Already have an account?
        </Link>
      </p>
    </form>
  )
}
