import { apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
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

export const ClientUsersApi = {
  list: (params?: ClientUserSearchParams): Promise<UserListResponse> => {
    const query: Record<string, unknown> = {};
    if (params?.q) query.q = params.q;
    if (params?.role) query.role = params.role;
    if (params?.is_active !== undefined) query.is_active = params.is_active;
    if (params?.sort_by) query.sort_by = params.sort_by;
    if (params?.sort_dir) query.sort_dir = params.sort_dir;
    // Backend uses 0-based pages
    if (params?.page !== undefined) query.page = Math.max(0, params.page - 1);
    if (params?.page_size) query.page_size = params.page_size;
    return apiGet<UserListResponse>('users', query);
  },

  create: (data: CreateClientUserPayload): Promise<{ data: ClientUser }> =>
    apiPost<{ data: ClientUser }>('users', data),

  update: (id: string, data: UpdateClientUserPayload): Promise<{ data: ClientUser }> =>
    apiPatch<{ data: ClientUser }>(`users/${id}`, data),
} as const;
