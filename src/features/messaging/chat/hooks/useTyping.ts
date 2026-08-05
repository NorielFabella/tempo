import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getTypingUsers, setTypingStatus } from '../services/typing.service'

export function useTyping(roomId: string) {
  const queryClient = useQueryClient()

  const typingUsers = useQuery({
    queryKey: ['typing', roomId],
    queryFn: () => getTypingUsers(roomId),
    enabled: Boolean(roomId),
    staleTime: 1000,
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

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['typing', roomId],
      })
    },
  })

  return {
    ...typingUsers,
    setTyping,
  }
}
