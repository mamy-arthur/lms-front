import { apiPost, apiPut } from '@/shared/lib/apiClient';
import type { CreateTenantUserPayload, TenantUser, UpdateTenantUserPayload } from '../types';

interface CreateUserResponse {
  data: TenantUser;
}

export const tenantUsersApi = {
  create: (data: CreateTenantUserPayload): Promise<CreateUserResponse> =>
    apiPost<CreateUserResponse>('users', data),

  update: (id: string, data: UpdateTenantUserPayload): Promise<{ data: TenantUser }> =>
    apiPut<{ data: TenantUser }>(`users/${id}`, data),
} as const;
