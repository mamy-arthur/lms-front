import { useQuery } from '@tanstack/react-query';
import { portalLearningPathsApi } from '@/shared/api/portal.api';
import { portalLearningPathKeys } from '@/shared/queries/keys';
import { mapSummaryToFormation } from '../lib/summary-mapper';
import type { Formation } from '../lib/types';

export function useFormationSummaryQuery(enrollmentId: string) {
  return useQuery<Formation>({
    queryKey: portalLearningPathKeys.summary(enrollmentId),
    queryFn: async () => {
      const res = await portalLearningPathsApi.summary(enrollmentId);
      return mapSummaryToFormation(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}
