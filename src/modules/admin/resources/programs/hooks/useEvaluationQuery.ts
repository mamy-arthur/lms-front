import { useQuery } from '@tanstack/react-query';
import { evaluationsApi } from '@/shared/api/evaluations.api';
import { evaluationKeys } from '@/shared/queries/keys';

export function useEvaluationQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: evaluationKeys.detail(id ?? ''),
    queryFn: () => evaluationsApi.getById(id!),
    enabled: !!id,
  });
}
