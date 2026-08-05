import { useQuery } from '@tanstack/react-query';
import { evaluationsApi } from '@/shared/api/evaluations.api';
import { evaluationKeys } from '@/shared/queries/keys';

export function useEvaluationsQuery(learningPathId: string | null | undefined) {
  return useQuery({
    queryKey: evaluationKeys.listByLearningPath(learningPathId ?? ''),
    queryFn: () => evaluationsApi.list(learningPathId!),
    enabled: !!learningPathId,
  });
}
