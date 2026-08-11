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
  get: (courseId: string, entryId: string) =>
    apiGet<{ data: ApiPortalContentEntry }>(`courses/${courseId}/entries/${entryId}`),
};
