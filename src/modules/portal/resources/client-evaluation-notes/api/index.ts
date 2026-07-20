import { apiGet } from '@/shared/lib/apiClient';
import type {
  FormationSummaryListResponse,
  FormationDetailResponse,
} from '@/modules/shared/lib/evaluation-notes';

export const portalEvaluationNotesApi = {
  /**
   * Returns the list of formations with pre-computed stats.
   * GET /evaluation-notes/formations
   */
  listFormations: () => apiGet<FormationSummaryListResponse>('evaluation-notes/formations'),

  /**
   * Returns the full detail (notes table) for a single formation.
   * GET /evaluation-notes/formations/:id
   */
  getFormation: (id: string) =>
    apiGet<FormationDetailResponse>(`evaluation-notes/formations/${id}`),
};
