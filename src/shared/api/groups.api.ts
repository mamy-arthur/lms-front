import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import type {
  AddGroupMemberPayload,
  ApiGroup,
  ApiGroupsListResponse,
  CreateGroupPayload,
  GroupsListParams,
  UpdateGroupPayload,
} from '@/shared/types/group.types';

/**
 * Groupes CM — routes /groups
 * Authentification : token tenant (Gate client manager)
 */
export const groupsApi = {
  list: (params?: GroupsListParams) =>
    apiGet<ApiGroupsListResponse>('groups', params as Record<string, unknown>),

  get: (id: string) => apiGet<{ data: ApiGroup }>(`groups/${id}`),

  create: (data: CreateGroupPayload) => apiPost<{ data: ApiGroup }>('groups', data),

  update: (id: string, data: UpdateGroupPayload) =>
    apiPatch<{ data: ApiGroup }>(`groups/${id}`, data),

  remove: (id: string) => apiDelete(`groups/${id}`),

  addMember: (groupId: string, data: AddGroupMemberPayload) =>
    apiPost<{ data: ApiGroup }>(`groups/${groupId}/members`, data),

  removeMember: (groupId: string, traineeId: string) =>
    apiDelete(`groups/${groupId}/members/${traineeId}`),
};
