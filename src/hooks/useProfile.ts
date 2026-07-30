import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '@/api/profile.api';
import { queryKeys } from './queryKeys';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
    staleTime: 5 * 60_000,
  });
}
