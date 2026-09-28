import { apiGet } from '@/shared/lib/apiClient';
import type { ApiDashboardPage } from '@/shared/types/dashboard.types';
import type { ApiClientDashboardStudent, ClientDashboardOverview } from './types';

export const clientDashboardApi = {
  overview: () => apiGet<{ data: ClientDashboardOverview }>('dashboard/client/overview'),
  students: (page = 1) =>
    apiGet<ApiDashboardPage<ApiClientDashboardStudent>>('dashboard/client/students', {
      page,
      per_page: 100,
    }),
};

// The existing table and chart filter locally: never silently show just the first API page.
export async function getAllClientDashboardStudents(signal?: AbortSignal) {
  signal?.throwIfAborted();
  const first = await clientDashboardApi.students();
  signal?.throwIfAborted();
  const pages = Math.ceil(first.meta.total / first.meta.per_page);
  // Page 1 is already fetched; the rest can be requested in parallel instead of sequentially.
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      clientDashboardApi.students(index + 2),
    ),
  );
  signal?.throwIfAborted();
  const students = [...first.data, ...rest.flatMap((response) => response.data)];
  return [...new Map(students.map((student) => [student.id, student])).values()];
}
