import { apiGet } from '@/shared/lib/apiClient';
import type {
  ApiDashboardEnrollment,
  ApiDashboardFormation,
  ApiDashboardOverview,
  ApiDashboardPage,
  DashboardFormationsParams,
} from '@/shared/types/dashboard.types';
import type { EnrollmentStatus } from '@/shared/types/enrollment.types';

export const editorDashboardApi = {
  overview: () => apiGet<{ data: ApiDashboardOverview }>('platform/dashboard/overview'),
  formations: (params: DashboardFormationsParams) =>
    apiGet<ApiDashboardPage<ApiDashboardFormation>>('platform/dashboard/formations', { ...params }),
  enrollments: (
    formationId: string,
    params: { status?: EnrollmentStatus; page?: number; per_page?: number } = {},
  ) =>
    apiGet<ApiDashboardPage<ApiDashboardEnrollment>>(
      `platform/dashboard/formations/${formationId}/enrollments`,
      params,
    ),
};
