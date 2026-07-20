import { apiGet } from '@/shared/lib/apiClient';
import type {
  FormationSummaryListResponse,
  FormationDetailResponse,
} from '@/modules/shared/lib/evaluation-notes';
import type { AdminEvaluationNotesParams } from '../types';

export const adminEvaluationNotesApi = {
  /**
   * Returns the list of formations with pre-computed stats.
   * GET /admin/evaluation-notes/formations
   */
  listFormations: (params?: AdminEvaluationNotesParams) =>
    apiGet<FormationSummaryListResponse>(
      'admin/evaluation-notes/formations',
      params as Record<string, unknown> | undefined,
    ),

  /**
   * Returns the full detail (notes table) for a single formation.
   * GET /admin/evaluation-notes/formations/:id
   */
  getFormation: (id: string) =>
    apiGet<FormationDetailResponse>(`admin/evaluation-notes/formations/${id}`),
};
