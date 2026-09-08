import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib/apiClient';
import type {
  ApiContentEntry,
  ApiContentEntryListResponse,
  CreateContentEntryPayload,
  MoveContentEntryPayload,
  UpdateContentEntryPayload,
} from '@/shared/types/course.types';

export const contentEntriesApi = {
  list: (sectionId: string, page = 1, perPage = 50) =>
    apiGet<ApiContentEntryListResponse>(`platform/course-sections/${sectionId}/entries`, {
      page,
      per_page: perPage,
    }),

  get: (id: string) => apiGet<{ data: ApiContentEntry }>(`platform/entries/${id}`),

  create: (sectionId: string, data: CreateContentEntryPayload) =>
    apiPost<{ data: ApiContentEntry }>(`platform/course-sections/${sectionId}/entries`, data),

  update: (id: string, data: UpdateContentEntryPayload) =>
    apiPut<{ data: ApiContentEntry }>(`platform/entries/${id}`, data),

  /** Reorders within a section, or moves to another one. Responds 204 with no body. */
  move: (id: string, data: MoveContentEntryPayload) =>
    apiPost<void>(`platform/entries/${id}/move`, data),

  remove: (id: string) => apiDelete(`platform/entries/${id}`),
};
