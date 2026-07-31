import { apiGet } from '@/shared/lib/apiClient';
import type { ApiUsersListResponse, UsersListParams } from '@/shared/types/user.types';

/**
 * Users tenant — routes /users
 * Authentification : token tenant
 */
export const usersApi = {
  list: (params?: UsersListParams) =>
    apiGet<ApiUsersListResponse>('users', params as Record<string, unknown>),
};
