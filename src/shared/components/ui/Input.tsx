import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

import { cn } from '@/shared/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors',
          'focus:border-slate-900 focus:ring-2 focus:ring-slate-200',
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'
