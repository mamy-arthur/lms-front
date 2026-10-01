import { apiGet } from '@/shared/lib/apiClient';
import type {
  ApiDashboardEnrollmentsPage,
  ApiDashboardFormation,
  ApiDashboardOverview,
  ApiDashboardPage,
  DashboardFormationsParams,
  DashboardEnrollmentsParams,
} from '@/shared/types/dashboard.types';

export const editorDashboardApi = {
  overview: (signal?: AbortSignal) =>
    apiGet<{ data: ApiDashboardOverview }>('platform/dashboard/overview', undefined, { signal }),
  formations: (params: DashboardFormationsParams, signal?: AbortSignal) =>
    apiGet<ApiDashboardPage<ApiDashboardFormation>>(
      'platform/dashboard/formations',
      { ...params },
      { signal },
    ),
  enrollments: (
    formationId: string,
    params: DashboardEnrollmentsParams = {},
    signal?: AbortSignal,
  ) =>
    apiGet<ApiDashboardEnrollmentsPage>(
      `platform/dashboard/formations/${encodeURIComponent(formationId)}/enrollments`,
      { ...params },
      { signal },
    ),
};
