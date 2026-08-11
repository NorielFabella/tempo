import { useQuery } from '@tanstack/react-query'

import { getMessageAttachments } from '../services/attachments.service'

export function useMessageAttachments(messageIds: string[]) {
  return useQuery({
    queryKey: ['message-attachments', messageIds],
    queryFn: () => getMessageAttachments(messageIds),
    enabled: messageIds.length > 0,
  })
}
