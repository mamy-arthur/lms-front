import { apiGet, apiPost } from '@/shared/lib/apiClient';
import type {
  ApiAssignmentsListResponse,
  AssignmentsListParams,
  CreateAssignmentPayload,
  CreateAssignmentResponse,
} from '@/shared/types/assignment.types';

/**
 * Assignations CM — routes /assignments
 * Authentification : token tenant (Gate client manager)
 */
export const assignmentsApi = {
  list: (params?: AssignmentsListParams) =>
    apiGet<ApiAssignmentsListResponse>('assignments', params as Record<string, unknown>),

  create: (data: CreateAssignmentPayload) =>
    apiPost<CreateAssignmentResponse>('assignments', data),
};
