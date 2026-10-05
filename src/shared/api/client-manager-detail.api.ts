import { apiGet } from '@/shared/lib/apiClient';
import type { User } from '@/shared/types/user.types';
import type { UserDetailArea } from '@/shared/types/user-detail.types';
import { userDetailPath as userPath } from '@/shared/utils/user-detail-path';
import type {
  ClientManagerPurchasesParams,
  ClientManagerPurchasesResponse,
} from '@/shared/types/client-manager-detail.types';

export const clientManagerDetailApi = {
  profile: (area: UserDetailArea, id: string, signal?: AbortSignal) =>
    apiGet<{ data: User }>(userPath(area, id), undefined, { signal }),
  purchases: (
    area: UserDetailArea,
    id: string,
    params: ClientManagerPurchasesParams,
    signal?: AbortSignal,
  ) =>
    apiGet<ClientManagerPurchasesResponse>(
      `${userPath(area, id)}/purchased-learning-paths`,
      { ...params },
      { signal },
    ),
};
