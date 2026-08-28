import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateProfile } from '../services/profile.service'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['profile'],
      })

      void queryClient.invalidateQueries({
        queryKey: ['profiles'],
      })

      void queryClient.invalidateQueries({
        queryKey: ['profile-search'],
      })
    },
  })
}
