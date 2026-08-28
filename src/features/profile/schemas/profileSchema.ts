import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required.'),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
