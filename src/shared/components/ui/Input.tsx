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
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400',
          'focus:border-slate-900 focus:ring-2 focus:ring-slate-200',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
          'dark:focus:border-slate-400 dark:focus:ring-slate-800',
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'
