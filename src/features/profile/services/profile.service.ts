import { validateAvatarFile } from '@/shared/lib/avatarValidation'
import { supabase } from '@/shared/supabase/client'
import type { Profile, ProfileSearchResult } from '../types/profile'

const AVATAR_BUCKET = 'avatars'

export async function getCurrentProfile(): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not found.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getProfilesByIds(userIds: string[]): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (error) {
    throw error
  }

  return data
}

export async function uploadAvatar(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not found.')
  }

  const extension = validateAvatarFile(file)

  const filePath = `${user.id}/avatar.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    throw uploadError
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    throw profileError
  }

  return publicUrl
}

export async function searchProfiles(
  searchQuery: string,
): Promise<ProfileSearchResult[]> {
  const { data, error } = await supabase.rpc('search_profiles', {
    search_query: searchQuery,
  })

  if (error) {
    throw error
  }

  return data
}
