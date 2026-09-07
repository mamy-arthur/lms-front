import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import type { CreateUserPayload, UpdateUserPayload, User, UserSearchParams } from '../types';

interface UserListResponse {
  data: User[];
  total: number;
}

export const adminUsersApi = {
  list: (params?: UserSearchParams) => {
    const query: Record<string, unknown> = {};
    if (params?.q) query.q = params.q;
    if (params?.roles?.length) query.roles = params.roles;
    if (params?.is_active !== undefined) query.is_active = params.is_active;
    if (params?.tenant_id) query.tenant_id = params.tenant_id;
    if (params?.sort_by) query.sort_by = params.sort_by;
    if (params?.sort_dir) query.sort_dir = params.sort_dir;
    if (params?.page !== undefined) query.page = params.page;
    if (params?.page_size) query.page_size = params.page_size;
    return apiGet<UserListResponse>('platform/users', query);
  },

  getById: (id: string) => apiGet<{ data: User }>(`platform/users/${id}`),

  create: (data: CreateUserPayload) => apiPost<{ data: User }>('platform/users', data),

  update: (id: string, data: UpdateUserPayload) =>
    apiPatch<{ data: User }>(`platform/users/${id}`, data),

  remove: (id: string) => apiDelete(`platform/users/${id}`),

  /** Réinitialise le 2FA : invalide le challenge en cours et révoque les appareils de confiance. */
  resetTwoFactor: (id: string) =>
    apiPost<{ message: string }>(`platform/users/${id}/reset-two-factor`),
};
