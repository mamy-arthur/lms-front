import { useQuery } from '@tanstack/react-query';
import {
  MOCK_PORTAL_FORMATION_EVALUATIONS,
  MOCK_PORTAL_EVALUATION_FORMATIONS,
} from '../mocks/client-evaluation-notes.mock';
import { toEvaluationNotes } from '@/modules/shared/lib/formation-evaluations';
import type { FormationDetail } from '@/modules/shared/lib/evaluation-notes';
import { useTenant } from '@/shared/hooks/useTenant';

export const PORTAL_FORMATION_EVALUATION_NOTES_QUERY_KEY = [
  'portal',
  'evaluation-notes',
  'formation-detail',
] as const;

/**
 * Fetches full evaluation detail for a single portal formation (used by the drawer).
 * Triggered only when a formation is selected — not on list load.
 *
 * TODO: replace the queryFn body with: portalEvaluationNotesApi.getFormation(formationId)
 */
export function useClientFormationEvaluationNotesQuery(formationId: string | null) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: [...PORTAL_FORMATION_EVALUATION_NOTES_QUERY_KEY, formationId, tenant?.id ?? 'mock'],
    enabled: !!formationId,
    queryFn: async (): Promise<{ data: FormationDetail }> => {
      // TODO: replace with real API call:
      // return portalEvaluationNotesApi.getFormation(formationId!);

      const record = MOCK_PORTAL_FORMATION_EVALUATIONS.find((r) => r.formationId === formationId);
      const formation = MOCK_PORTAL_EVALUATION_FORMATIONS.find((f) => f.id === formationId);

      const rows = record
        ? toEvaluationNotes(
            record,
            formation?.name ?? formationId ?? '',
            formation?.coverImage,
            formation?.category,
          ).map((item) => ({
            ...item,
            clientId: tenant?.id ?? item.clientId,
            clientName: tenant?.name ?? item.clientName,
          }))
        : [];

      const evaluations = record
        ? record.evaluations.map((e) => ({ id: e.id, label: e.title }))
        : [];

      return {
        data: {
          id: formationId ?? '',
          name: formation?.name ?? formationId ?? '',
          coverImage: formation?.coverImage,
          category: formation?.category,
          evaluations,
          rows,
        },
      };
    },
    placeholderData: (previous) => previous,
  });
}
