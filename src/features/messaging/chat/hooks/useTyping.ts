import { useMutation, useQuery } from '@tanstack/react-query'

import { getTypingUsers, setTypingStatus } from '../services/typing.service'

export function useTyping(roomId: string) {
  const typingUsers = useQuery({
    queryKey: ['typing', roomId],
    queryFn: () => getTypingUsers(roomId),
    enabled: Boolean(roomId),
  })

  const setTyping = useMutation({
    mutationFn: ({
      roomId,
      userId,
      isTyping,
    }: {
      roomId: string
      userId: string
      isTyping: boolean
    }) => setTypingStatus(roomId, userId, isTyping),
  })

  return {
    ...typingUsers,
    setTyping,
  }
}
