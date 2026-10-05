import { apiGet } from '@/shared/lib/apiClient';
import type { User } from '@/modules/admin/resources/users/types';
import type {
  TraineeDetailArea,
  TraineeEnrollmentsParams,
  TraineeEnrollmentsResponse,
} from '@/shared/types/trainee-detail.types';

const userPath = (area: TraineeDetailArea, id: string) =>
  `${area === 'admin' ? 'platform/' : ''}users/${encodeURIComponent(id)}`;

export const traineeDetailApi = {
  profile: (area: TraineeDetailArea, id: string, signal?: AbortSignal) =>
    apiGet<{ data: User }>(userPath(area, id), undefined, { signal }),
  enrollments: (
    area: TraineeDetailArea,
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
