import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL.'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'VITE_SUPABASE_ANON_KEY is required.'),
})

function getEnv() {
  const result = envSchema.safeParse(import.meta.env)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n')

    throw new Error(`Invalid environment configuration:\n${issues}`)
  }

  return result.data
}

export const env = Object.freeze(getEnv())
