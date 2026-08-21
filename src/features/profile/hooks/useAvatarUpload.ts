import { useMutation, useQueryClient } from '@tanstack/react-query'

import { uploadAvatar } from '../services/profile.service'

export function useAvatarUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['profile'],
      })
    },
  })
}
