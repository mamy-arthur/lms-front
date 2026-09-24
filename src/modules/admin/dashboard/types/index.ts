import type {
  ApiDashboardFormation,
  ApiDashboardOverview,
  ApiDashboardStatusCounts,
  DashboardStatusCounts,
} from '@/shared/types/dashboard.types';
import { ENROLLMENT_STATUSES } from '@/shared/types/enrollment.types';

function normalizeStatusCounts(counts: ApiDashboardStatusCounts = {}): DashboardStatusCounts {
  return Object.fromEntries(
    ENROLLMENT_STATUSES.map((status) => [status, counts[status] ?? 0]),
  ) as DashboardStatusCounts;
}

export function normalizeDashboardFormation(formation: ApiDashboardFormation) {
  return {
    id: formation.id,
    name: formation.name,
    isPublished: formation.is_published,
    totalEnrollments: formation.total_enrollments,
    completionRate: formation.completion_rate,
    statusCounts: normalizeStatusCounts(formation.status_counts),
  };
}

export function normalizeDashboardOverview(overview: ApiDashboardOverview) {
  const totalEnrollments = overview.students.total_enrollments;
  const completedEnrollments = overview.students.status_counts.completed ?? 0;

  return {
    catalog: overview.catalog,
    students: {
      uniqueStudents: overview.students.unique_students,
      totalEnrollments,
      completionRate:
        totalEnrollments > 0
          ? Math.round((10000 * completedEnrollments) / totalEnrollments) / 100
          : 0,
      statusCounts: normalizeStatusCounts(overview.students.status_counts),
    },
  };
}

export type DashboardFormation = ReturnType<typeof normalizeDashboardFormation>;
export type DashboardOverview = ReturnType<typeof normalizeDashboardOverview>;
