import { useQuery, useQueries } from '@tanstack/react-query';
import { editorShopApi } from '@/shared/api/learning-paths.api';
import { coursesApi } from '@/shared/api/courses.api';
import { adminModulesApi } from '../../modules/api';
import { normalizeModule } from '../../modules/types';
import { shopLearningPathKeys, courseKeys } from '@/shared/queries/keys';
import type { CompetencyApiResponse } from '../../modules/types';
import type { StoreProgramStep } from '@/shared/mocks/store.mock';

/**
 * Fetches a shop LP + its competency details (modules + course names) in parallel.
 * Used by the admin shop detail page to populate programSteps.
 */
export function useShopFormationDetails(id: string) {
  // 1. Fetch the LP from the editor shop route
  const lpQuery = useQuery({
    queryKey: shopLearningPathKeys.detail(id),
    queryFn: async () => {
      const res = await editorShopApi.get(id);
      return res.data;
    },
    enabled: !!id,
  });

  const lp = lpQuery.data;
  const competencies = lp?.competencies ?? [];

  // 2. Fetch all courses in parallel (for name lookup)
  const coursesQuery = useQuery({
    queryKey: courseKeys.lists(),
    queryFn: () => coursesApi.list(),
    enabled: !!lp,
    staleTime: 5 * 60 * 1000,
  });

  // 3. Fetch each module detail in parallel (sorted by position)
  const sortedCompetencies = [...competencies].sort((a, b) => a.position - b.position);

  const moduleQueries = useQueries({
    queries: sortedCompetencies.map((c) => ({
      queryKey: ['admin', 'modules', 'detail-by-id', c.competency_id],
      queryFn: async () => {
        const res = await adminModulesApi.getById(c.competency_id);
        const raw = (res.data ?? res) as CompetencyApiResponse;
        return normalizeModule(raw);
      },
      enabled: !!lp,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // 4. Build course name lookup: { courseId → full_name }
  const courseMap: Record<string, string> = Object.fromEntries(
    (coursesQuery.data?.data ?? []).map((c) => [c.id, c.full_name]),
  );

  // 5. Build programSteps
  const programSteps: StoreProgramStep[] = sortedCompetencies.map((c, i) => {
    const module = moduleQueries[i]?.data;
    return {
      id: c.competency_id,
      type: 'module' as const,
      title: module?.shortname ?? '',
      lessons: (module?.courseIds ?? []).map((courseId) => courseMap[courseId] ?? courseId),
    };
  });

  const isLoading =
    lpQuery.isLoading ||
    (!!lp && (coursesQuery.isLoading || moduleQueries.some((q) => q.isLoading)));

  return {
    lp,
    programSteps,
    isLoading,
    isError: lpQuery.isError,
  };
}
