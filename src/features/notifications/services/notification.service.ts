import { supabase } from '@/shared/supabase/client'

import type { Notification } from '../types/notification'

const NOTIFICATION_HISTORY_LIMIT = 50

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not found.')
  }

  return user.id
}

export async function getNotifications(): Promise<Notification[]> {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(NOTIFICATION_HISTORY_LIMIT)

  if (error) {
    throw error
  }

  return data
}

export async function getUnreadNotificationCount(): Promise<number> {
  const userId = await getCurrentUserId()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null)

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const userId = await getCurrentUserId()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', userId)
    .is('read_at', null)

  if (error) {
    throw error
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const userId = await getCurrentUserId()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .is('read_at', null)

  if (error) {
    throw error
  }
}
