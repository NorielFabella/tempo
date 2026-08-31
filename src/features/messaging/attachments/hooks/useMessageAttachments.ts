import { useQuery } from '@tanstack/react-query'

import { getMessageAttachments } from '../services/attachments.service'

export function useMessageAttachments(messageIds: string[]) {
  return useQuery({
    queryKey: ['message-attachments', messageIds],
    queryFn: () => getMessageAttachments(messageIds),
    enabled: messageIds.length > 0,
    placeholderData: (previousData) => previousData,

    // Signed attachment URLs are valid for 1 hour.
    // Keep this query fresh for 55 minutes so returning to a room
    // reuses the existing signed URLs instead of generating new ones.
    staleTime: 55 * 60 * 1000,
  })
}
