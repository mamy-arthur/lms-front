import { apiGet } from '@/shared/lib/apiClient';
import type {
  ApiPortalLearningPathSummary,
  ApiPortalContentEntry,
} from '@/shared/types/portal.types';

export const portalLearningPathsApi = {
  summary: (id: string) =>
    apiGet<{ data: ApiPortalLearningPathSummary }>(`learning-paths/${id}/summary`),
};

export const portalContentEntriesApi = {
  get: (learningPathId: string, courseId: string, entryId: string) =>
    apiGet<{ data: ApiPortalContentEntry }>(
      `learning-paths/${learningPathId}/courses/${courseId}/entries/${entryId}`,
    ),
};
