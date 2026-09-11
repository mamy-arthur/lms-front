import { useQuery, useQueryClient } from '@tanstack/react-query';
import { portalLearningPathsApi } from '@/shared/api/portal.api';
import { portalLearnerEvaluationKeys } from '@/shared/queries/keys';
import type { ApiLearnerEvaluation } from '@/shared/types/portal.types';

/**
 * Les évaluations sont désormais lues par inscription : c'est elle qui porte les
 * compteurs de tentatives, et non le parcours.
 */
export function usePortalLearnerEvaluationQuery(
  enrollmentId: string | undefined,
  evaluationId: string,
) {
  return useQuery<ApiLearnerEvaluation[], unknown, ApiLearnerEvaluation | null>({
    queryKey: portalLearnerEvaluationKeys.list(enrollmentId ?? ''),
    queryFn: async () => {
      const res = await portalLearningPathsApi.learnerEvaluations(enrollmentId!);
      return res.data;
    },
    select: (data) => data.find((e) => e.id === evaluationId) ?? null,
    enabled: !!enrollmentId,
    staleTime: 0,
  });
}

export function useInvalidateLearnerEvaluation() {
  const queryClient = useQueryClient();
  return (enrollmentId: string) =>
    queryClient.invalidateQueries({ queryKey: portalLearnerEvaluationKeys.list(enrollmentId) });
}
