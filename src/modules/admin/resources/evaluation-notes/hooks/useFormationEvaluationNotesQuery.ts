import { useQuery } from '@tanstack/react-query';
import {
  MOCK_FORMATION_EVALUATIONS,
  MOCK_ADMIN_EVALUATION_FORMATIONS,
} from '@/shared/mocks/formation-evaluations.mock';
import { toEvaluationNotes } from '@/modules/shared/lib/formation-evaluations';
import type { FormationDetail } from '@/modules/shared/lib/evaluation-notes';

export const ADMIN_FORMATION_EVALUATION_NOTES_QUERY_KEY = [
  'admin',
  'evaluation-notes',
  'formation-detail',
] as const;

/**
 * Fetches full evaluation detail for a single formation (used by the drawer).
 * Triggered only when a formation is selected — not on list load.
 *
 * TODO: replace the queryFn body with: adminEvaluationNotesApi.getFormation(formationId)
 */
export function useFormationEvaluationNotesQuery(formationId: string | null) {
  return useQuery({
    queryKey: [...ADMIN_FORMATION_EVALUATION_NOTES_QUERY_KEY, formationId],
    enabled: !!formationId,
    queryFn: async (): Promise<{ data: FormationDetail }> => {
      // TODO: replace with real API call:
      // return adminEvaluationNotesApi.getFormation(formationId!);

      const record = MOCK_FORMATION_EVALUATIONS.find((r) => r.formationId === formationId);
      const formation = MOCK_ADMIN_EVALUATION_FORMATIONS.find((f) => f.id === formationId);

      const rows = record
        ? toEvaluationNotes(
            record,
            formation?.name ?? formationId ?? '',
            formation?.coverImage,
            formation?.category,
          )
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
