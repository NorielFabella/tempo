import { useQuery } from '@tanstack/react-query'
import { getCurrentProfile } from '../services/profile.service'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getCurrentProfile,
  })
}
