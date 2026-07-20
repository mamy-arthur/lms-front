import { useQuery } from '@tanstack/react-query';
import {
  MOCK_ADMIN_EVALUATION_FORMATIONS,
  MOCK_ADMIN_CLIENTS,
} from '@/shared/mocks/formation-evaluations.mock';
import type { FormationSummary } from '@/modules/shared/lib/evaluation-notes';
import type { AdminEvaluationNotesParams } from '../types';

export const ADMIN_EVALUATION_NOTES_QUERY_KEY = [
  'admin',
  'evaluation-notes',
  'formations',
] as const;

export function useEvaluationNotesQuery(params?: AdminEvaluationNotesParams) {
  return useQuery({
    queryKey: [...ADMIN_EVALUATION_NOTES_QUERY_KEY, params],
    queryFn: async (): Promise<{
      data: FormationSummary[];
      clients: typeof MOCK_ADMIN_CLIENTS;
      total: number;
    }> => {
      // TODO: replace with real API call: adminEvaluationNotesApi.listFormations(params)
      // The API returns pre-computed stats — no client-side grouping or calculation needed.

      const search = params?.q?.trim().toLowerCase();

      let data: FormationSummary[] = MOCK_ADMIN_EVALUATION_FORMATIONS;

      if (search) {
        data = data.filter((f) => f.name.toLowerCase().includes(search));
      }
      // tenant_id filter would be applied server-side; omitted in mock (stats are per-formation, not per-tenant)

      return { data, clients: MOCK_ADMIN_CLIENTS, total: data.length };
    },
    placeholderData: (previous) => previous,
  });
}
