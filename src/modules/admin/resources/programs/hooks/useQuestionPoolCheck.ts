import { useQuery } from '@tanstack/react-query';
import { evaluationsApi } from '@/shared/api/evaluations.api';
import { evaluationKeys } from '@/shared/queries/keys';

export function useQuestionPoolCheck(
  learningPathId: string,
  questionBankIds: string[],
  competencyIds: string[],
) {
  return useQuery({
    queryKey: evaluationKeys.poolCheck(learningPathId, questionBankIds, competencyIds),
    queryFn: () => evaluationsApi.poolCheck(learningPathId, questionBankIds, competencyIds),
    enabled: !!learningPathId && questionBankIds.length > 0 && competencyIds.length > 0,
  });
}
