import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'

import { cn } from '@/shared/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400',
  secondary:
    'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100',
  danger:
    'bg-red-600 text-white hover:bg-red-700',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed',
          variants[variant],
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
