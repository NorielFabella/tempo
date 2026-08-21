import { supabase } from '@/shared/supabase/client'
import type { Profile, ProfileSearchResult } from '../types/profile'

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_SIZE = 1 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function getFileExtension(file: File) {
  switch (file.type) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return null
  }
}

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

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, or WebP image.')
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('Avatar image must be 1 MB or smaller.')
  }

  const extension = getFileExtension(file)

  if (!extension) {
    throw new Error('Unsupported avatar image type.')
  }

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
