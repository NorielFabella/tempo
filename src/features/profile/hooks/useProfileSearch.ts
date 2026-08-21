import { useQuery } from '@tanstack/react-query'

import { searchProfiles } from '../services/profile.service'

export function useProfileSearch(searchQuery: string) {
  const normalizedQuery = searchQuery.trim()

  return useQuery({
    queryKey: ['profile-search', normalizedQuery],
    queryFn: () => searchProfiles(normalizedQuery),
    enabled: normalizedQuery.length >= 2,
  })
}
