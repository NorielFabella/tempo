import { supabase } from '@/shared/supabase/client'
import type { Tables } from '@/shared/types/database'
import type { RoomWithMetadata } from '../types/room'

export type Room = Tables<'rooms'>

export async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function getRoomsWithMetadata(
  currentUserId: string,
): Promise<RoomWithMetadata[]> {
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  if (roomsError) {
    throw roomsError
  }

  if (!rooms.length) {
    return []
  }

  const roomIds = rooms.map((room) => room.id)

  const { data: roomMembers, error: roomMembersError } = await supabase
    .from('room_members')
    .select('room_id, user_id')
    .in('room_id', roomIds)

  if (roomMembersError) {
    throw roomMembersError
  }

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id, room_id, sender_id, content, created_at, read_at')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false })

  if (messagesError) {
    throw messagesError
  }

  const messageIds = messages.map((message) => message.id)

  const { data: attachments, error: attachmentsError } =
    messageIds.length > 0
      ? await supabase
          .from('message_attachments')
          .select('message_id')
          .in('message_id', messageIds)
      : { data: [], error: null }

  if (attachmentsError) {
    throw attachmentsError
  }

  const attachmentMessageIds = new Set(
    attachments.map((attachment) => attachment.message_id),
  )

  const latestMessageByRoom = new Map<
    string,
    {
      content: string
      created_at: string
      sender_id: string
      has_attachments: boolean
    }
  >()

  const unreadCountByRoom = new Map<string, number>()

  for (const message of messages) {
    if (!latestMessageByRoom.has(message.room_id)) {
      latestMessageByRoom.set(message.room_id, {
        content: message.content,
        created_at: message.created_at,
        sender_id: message.sender_id,
        has_attachments: attachmentMessageIds.has(message.id),
      })
    }

    if (message.sender_id !== currentUserId && message.read_at === null) {
      unreadCountByRoom.set(
        message.room_id,
        (unreadCountByRoom.get(message.room_id) ?? 0) + 1,
      )
    }
  }

  const latestMessages = [...latestMessageByRoom.values()]
  const latestSenderIds = [
    ...new Set(latestMessages.map((message) => message.sender_id)),
  ]

  const { data: senderProfiles, error: senderProfilesError } =
    latestSenderIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', latestSenderIds)
      : { data: [], error: null }

  if (senderProfilesError) {
    throw senderProfilesError
  }

  const senderProfilesById = new Map(
    senderProfiles.map((profile) => [profile.id, profile]),
  )

  const directMessageUserIds = [
    ...new Set(
      roomMembers
        .filter((member) => member.user_id !== currentUserId)
        .map((member) => member.user_id),
    ),
  ]

  const { data: directMessageProfiles, error: directMessageProfilesError } =
    directMessageUserIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', directMessageUserIds)
      : { data: [], error: null }

  if (directMessageProfilesError) {
    throw directMessageProfilesError
  }

  const directMessageProfilesById = new Map(
    directMessageProfiles.map((profile) => [profile.id, profile]),
  )

  const roomsWithMetadata = rooms.map((room) => {
    const latestMessage = latestMessageByRoom.get(room.id)

    const roomMembersForRoom = roomMembers.filter(
      (member) => member.room_id === room.id,
    )

    const otherUserId =
      roomMembersForRoom.find((member) => member.user_id !== currentUserId)
        ?.user_id ?? null

    const otherUserName = otherUserId
      ? directMessageProfilesById.get(otherUserId)?.full_name ?? null
      : null

    if (!latestMessage) {
      return {
        ...room,
        latest_message: null,
        unread_count: unreadCountByRoom.get(room.id) ?? 0,
        other_user_name: otherUserName,
      }
    }

    const senderProfile = senderProfilesById.get(latestMessage.sender_id)

    return {
      ...room,
      latest_message: {
        ...latestMessage,
        sender_name: senderProfile?.full_name ?? '',
        sender_email: senderProfile?.email ?? '',
      },
      unread_count: unreadCountByRoom.get(room.id) ?? 0,
      other_user_name: otherUserName,
    }
  })

  return roomsWithMetadata.sort((a, b) => {
    if (!a.latest_message && !b.latest_message) {
      return 0
    }

    if (!a.latest_message) {
      return 1
    }

    if (!b.latest_message) {
      return -1
    }

    return (
      new Date(b.latest_message.created_at).getTime() -
      new Date(a.latest_message.created_at).getTime()
    )
  })
}

export async function createRoom(name: string) {
  const { data, error } = await supabase.rpc('create_room', {
    room_name: name,
  })

  if (error) {
    throw error
  }

  return data
}

export async function getOrCreateDirectRoom(
  otherUserId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_direct_room', {
    other_user_id: otherUserId,
  })

  if (error) {
    throw error
  }

  return data
}

export async function getRoomMemberIds(roomId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('room_members')
    .select('user_id')
    .eq('room_id', roomId)

  if (error) {
    throw error
  }

  return data.map((member) => member.user_id)
}

export async function addRoomMember(
  roomId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('room_members').insert({
    room_id: roomId,
    user_id: userId,
  })

  if (error) {
    throw error
  }
}
