import { apiGet } from '@/shared/lib/apiClient';
import type { User } from '@/shared/types/user.types';
import type {
  TraineeEnrollmentsParams,
  TraineeEnrollmentsResponse,
} from '@/shared/types/trainee-detail.types';
import type { UserDetailArea } from '@/shared/types/user-detail.types';
import { userDetailPath as userPath } from '@/shared/utils/user-detail-path';

export const traineeDetailApi = {
  profile: (area: UserDetailArea, id: string, signal?: AbortSignal) =>
    apiGet<{ data: User }>(userPath(area, id), undefined, { signal }),
  enrollments: (
    area: UserDetailArea,
    id: string,
    params: TraineeEnrollmentsParams,
    signal?: AbortSignal,
  ) =>
    apiGet<TraineeEnrollmentsResponse>(
      `${userPath(area, id)}/enrollments`,
      { ...params },
      { signal },
    ),
};
