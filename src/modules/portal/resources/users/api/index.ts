import { apiPost, apiPut } from '@/shared/lib/apiClient';
import type { CreateClientUserPayload, ClientUser, UpdateClientUserPayload } from '../types';

interface CreateUserResponse {
  data: ClientUser;
}

export const ClientUsersApi = {
  create: (data: CreateClientUserPayload): Promise<CreateUserResponse> =>
    apiPost<CreateUserResponse>('users', data),

  update: (id: string, data: UpdateClientUserPayload): Promise<{ data: ClientUser }> =>
    apiPut<{ data: ClientUser }>(`users/${id}`, data),
} as const;
