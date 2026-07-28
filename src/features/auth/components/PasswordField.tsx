import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'

type PasswordFieldProps = {
  id: string
  label: string
  register: UseFormRegisterReturn
  error?: FieldError
  autoComplete: 'current-password' | 'new-password'
}

export function PasswordField({
  id,
  label,
  register,
  error,
  autoComplete,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  const errorId = `${id}-error`

  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: 'block', marginBottom: '0.35rem' }}
      >
        {label}
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...register}
          style={{
            flex: 1,
            padding: '0.65rem 0.75rem',
          }}
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && (
        <p
          id={errorId}
          style={{
            color: '#dc2626',
            marginTop: '0.35rem',
          }}
        >
          {error.message}
        </p>
      )}
    </div>
  )
}
