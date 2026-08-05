import { useQuery } from '@tanstack/react-query'

import { getProfilesByIds } from '../services/profile.service'

export function useProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ['profiles', userIds],
    queryFn: () => getProfilesByIds(userIds),
    enabled: userIds.length > 0,
  })
}
