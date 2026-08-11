import { useQuery } from '@tanstack/react-query';
import { progressionRulesApi } from '@/shared/api/progression-rules.api';
import { progressionRuleKeys } from '@/shared/queries/keys';

export function useProgressionRulesQuery(learningPathId: string | null) {
  return useQuery({
    queryKey: progressionRuleKeys.listByLearningPath(learningPathId ?? ''),
    queryFn: () => progressionRulesApi.list(learningPathId!).then((r) => r.data),
    enabled: !!learningPathId,
  });
}
