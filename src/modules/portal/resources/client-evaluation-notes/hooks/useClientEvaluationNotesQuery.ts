import { useQuery } from '@tanstack/react-query';
import { MOCK_PORTAL_EVALUATION_FORMATIONS } from '../mocks/client-evaluation-notes.mock';
import type { FormationSummary } from '@/modules/shared/lib/evaluation-notes';
import { useTenant } from '@/shared/hooks/useTenant';

export const PORTAL_EVALUATION_NOTES_QUERY_KEY = [
  'portal',
  'evaluation-notes',
  'formations',
] as const;

export function useClientEvaluationNotesQuery() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: [...PORTAL_EVALUATION_NOTES_QUERY_KEY, tenant?.id ?? 'mock'],
    queryFn: async (): Promise<{ data: FormationSummary[]; total: number }> => {
      // TODO: replace with real API call: portalEvaluationNotesApi.listFormations()
      // The API returns pre-computed stats — no client-side grouping or calculation needed.
      const data: FormationSummary[] = MOCK_PORTAL_EVALUATION_FORMATIONS;
      return { data, total: data.length };
    },
    placeholderData: (previous) => previous,
  });
}
