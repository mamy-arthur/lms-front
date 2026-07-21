import { useQuery } from '@tanstack/react-query';
import { adminModulesApi } from '../api';

export const AVAILABLE_COURSES_QUERY_KEY = ['admin', 'modules', 'available-courses'] as const;

/**
 * Fetches the list of courses that can be linked to a module.
 * Backed by GET /platform/competencies/available-courses.
 *
 * @param competencyId - When editing an existing module, pass its ID so the
 *   backend also returns the courses already linked to it (otherwise they
 *   would not appear in the selector).
 */
export function useAvailableCoursesQuery(competencyId?: string) {
  return useQuery({
    // When no competencyId is given (create mode), use the base key so the
    // shared cache entry is reused across form opens. When editing, scope the
    // key to the module ID so the extended course list is fetched separately.
    queryKey: competencyId
      ? [...AVAILABLE_COURSES_QUERY_KEY, competencyId]
      : AVAILABLE_COURSES_QUERY_KEY,
    queryFn: () => adminModulesApi.availableCourses(competencyId),
    staleTime: 5 * 60 * 1000, // 5 min — course list rarely changes mid-session
  });
}
