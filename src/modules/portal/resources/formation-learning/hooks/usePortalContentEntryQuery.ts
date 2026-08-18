import { useQuery } from '@tanstack/react-query';
import { portalContentEntriesApi } from '@/shared/api/portal.api';
import { portalContentEntryKeys } from '@/shared/queries/keys';
import type { ApiPortalContentEntry } from '@/shared/types/portal.types';

export function usePortalContentEntryQuery(
  enrollmentId: string | null,
  courseId: string | null,
  entryId: string | null,
) {
  return useQuery<ApiPortalContentEntry>({
    queryKey: portalContentEntryKeys.detail(enrollmentId ?? '', courseId ?? '', entryId ?? ''),
    queryFn: async () => {
      const res = await portalContentEntriesApi.get(enrollmentId!, courseId!, entryId!);
      return res.data;
    },
    enabled: !!(enrollmentId && courseId && entryId),
    staleTime: 10 * 60 * 1000,
  });
}
