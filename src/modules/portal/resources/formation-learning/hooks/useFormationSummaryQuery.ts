import { useQuery } from '@tanstack/react-query';
import { portalLearningPathsApi } from '@/shared/api/portal.api';
import { portalLearningPathKeys } from '@/shared/queries/keys';
import { mapSummaryToFormation } from '../lib/summary-mapper';
import type { Formation } from '../lib/types';

export function useFormationSummaryQuery(learningPathId: string | undefined) {
  return useQuery<Formation>({
    queryKey: portalLearningPathKeys.summary(learningPathId ?? ''),
    queryFn: async () => {
      const res = await portalLearningPathsApi.summary(learningPathId!);
      return mapSummaryToFormation(res.data);
    },
    enabled: !!learningPathId,
    staleTime: 5 * 60 * 1000,
  });
}
