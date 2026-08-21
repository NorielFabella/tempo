import type { Tables } from '@/shared/types/database'

export type Profile = Tables<'profiles'>

export type ProfileSearchResult = Pick<
  Profile,
  'id' | 'email' | 'full_name' | 'avatar_url'
>
