import type { Tables } from '@/shared/types/database'

export type Room = Tables<'rooms'>

export function getRoomInitials(roomName: string | null) {
  const parts = roomName?.trim().split(/\s+/).filter(Boolean) ?? []

  if (!parts.length) {
    return 'R'
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export type LatestMessageInfo = {
  content: string
  created_at: string
  sender_id: string
  sender_name: string
  sender_email: string
  has_attachments: boolean
}

export type RoomWithMetadata = Room & {
  latest_message: LatestMessageInfo | null
  unread_count: number
  other_user_name: string | null
}
