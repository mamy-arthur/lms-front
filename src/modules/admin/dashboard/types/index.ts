import type { ApiDashboardFormation, ApiDashboardOverview } from '@/shared/types/dashboard.types';

export function normalizeDashboardFormation(formation: ApiDashboardFormation) {
  return {
    id: formation.id,
    name: formation.name,
    isPublished: formation.is_published,
    totalEnrollments: formation.total_enrollments,
    completionRate: formation.completion_rate,
    statusCounts: formation.status_counts,
  };
}

export function normalizeDashboardOverview(overview: ApiDashboardOverview) {
  return {
    catalog: overview.catalog,
    students: {
      uniqueStudents: overview.students.unique_students,
      totalEnrollments: overview.students.total_enrollments,
      averageProgress: overview.students.average_progress_percent,
      statusCounts: overview.students.status_counts,
    },
  };
}

export type DashboardFormation = ReturnType<typeof normalizeDashboardFormation>;
export type DashboardOverview = ReturnType<typeof normalizeDashboardOverview>;
