import { useQuery } from '@tanstack/react-query';
import { portalContentEntriesApi } from '@/shared/api/portal.api';
import { portalContentEntryKeys } from '@/shared/queries/keys';
import type { ApiPortalContentEntry } from '@/shared/types/portal.types';

export function usePortalContentEntryQuery(
  learningPathId: string | null,
  courseId: string | null,
  entryId: string | null,
) {
  return useQuery<ApiPortalContentEntry>({
    queryKey: portalContentEntryKeys.detail(learningPathId ?? '', courseId ?? '', entryId ?? ''),
    queryFn: async () => {
      const res = await portalContentEntriesApi.get(learningPathId!, courseId!, entryId!);
      return res.data;
    },
    enabled: !!(learningPathId && courseId && entryId),
    staleTime: 10 * 60 * 1000,
  });
}
