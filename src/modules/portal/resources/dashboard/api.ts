import { apiGet } from '@/shared/lib/apiClient';
import type { ApiDashboardPage } from '@/shared/types/dashboard.types';
import type { ApiClientDashboardStudent, ClientDashboardOverview } from './types';

export const clientDashboardApi = {
  overview: (signal?: AbortSignal) =>
    apiGet<{ data: ClientDashboardOverview }>('dashboard/client/overview', undefined, { signal }),
  students: (page = 1, signal?: AbortSignal) =>
    apiGet<ApiDashboardPage<ApiClientDashboardStudent>>(
      'dashboard/client/students',
      { page, per_page: 100 },
      { signal },
    ),
};

const PAGE_CONCURRENCY = 4;

// The existing table and chart filter locally: never silently show just the first API page.
export async function getAllClientDashboardStudents(signal?: AbortSignal) {
  signal?.throwIfAborted();
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const first = await clientDashboardApi.students(1, controller.signal);
    controller.signal.throwIfAborted();
    const { total, per_page: perPage } = first.meta;
    if (
      !Number.isSafeInteger(total) ||
      total < 0 ||
      !Number.isSafeInteger(perPage) ||
      perPage <= 0
    ) {
      throw new Error('Invalid dashboard pagination');
    }
    const pages = Math.ceil(total / perPage);
    const students = new Map(first.data.map((student) => [student.id, student]));
    // Bounded batches avoid flooding the API for large rosters. Never publish partial results.
    for (let page = 2; page <= pages; page += PAGE_CONCURRENCY) {
      controller.signal.throwIfAborted();
      const batch = await Promise.all(
        Array.from({ length: Math.min(PAGE_CONCURRENCY, pages - page + 1) }, (_, index) =>
          clientDashboardApi.students(page + index, controller.signal),
        ),
      );
      controller.signal.throwIfAborted();
      for (const response of batch) {
        for (const student of response.data) students.set(student.id, student);
      }
    }
    return [...students.values()];
  } catch (error) {
    controller.abort();
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
  }
}
