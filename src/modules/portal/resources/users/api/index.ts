import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import type {
  ClientUser,
  ClientUserSearchParams,
  CreateClientUserPayload,
  UpdateClientUserPayload,
} from '../types';

interface UserListResponse {
  data: ClientUser[];
  total: number;
}

export const clientUsersApi = {
  list: (params?: ClientUserSearchParams): Promise<UserListResponse> => {
    const query: Record<string, unknown> = {};
    if (params?.q) query.q = params.q;
    if (params?.roles) query.roles = params.roles;
    if (params?.is_active !== undefined) query.is_active = params.is_active;
    if (params?.sort_by) query.sort_by = params.sort_by;
    if (params?.sort_dir) query.sort_dir = params.sort_dir;
    if (params?.page !== undefined) query.page = params.page;
    if (params?.page_size) query.page_size = params.page_size;
    return apiGet<UserListResponse>('users', query);
  },

  create: (data: CreateClientUserPayload): Promise<{ data: ClientUser }> =>
    apiPost<{ data: ClientUser }>('users', data),

  update: (id: string, data: UpdateClientUserPayload): Promise<{ data: ClientUser }> =>
    apiPatch<{ data: ClientUser }>(`users/${id}`, data),

  remove: (id: string): Promise<void> => apiDelete(`users/${id}`),
} as const;
