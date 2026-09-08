import { useQuery, useQueryClient } from '@tanstack/react-query';
import { portalLearningPathsApi } from '@/shared/api/portal.api';
import { portalLearnerEvaluationKeys } from '@/shared/queries/keys';
import type { ApiLearnerEvaluation } from '@/shared/types/portal.types';

export function usePortalLearnerEvaluationQuery(
  learningPathId: string | undefined,
  evaluationId: string,
) {
  return useQuery<ApiLearnerEvaluation[], unknown, ApiLearnerEvaluation | null>({
    queryKey: portalLearnerEvaluationKeys.list(learningPathId ?? ''),
    queryFn: async () => {
      const res = await portalLearningPathsApi.learnerEvaluations(learningPathId!);
      return res.data;
    },
    select: (data) => data.find((e) => e.id === evaluationId) ?? null,
    enabled: !!learningPathId,
    staleTime: 0,
  });
}

export function useInvalidateLearnerEvaluation() {
  const queryClient = useQueryClient();
  return (learningPathId: string) =>
    queryClient.invalidateQueries({ queryKey: portalLearnerEvaluationKeys.list(learningPathId) });
}
