import type { EnrollmentStatus } from './enrollment.types';

export type DashboardFormationSort = 'enrolled' | 'completion' | 'failed';
export type DashboardStatusCounts = Record<EnrollmentStatus, number>;

export interface ApiDashboardOverview {
  catalog: { total: number; published: number; unpublished: number };
  students: {
    unique_students: number;
    total_enrollments: number;
    average_progress_percent: number;
    status_counts: DashboardStatusCounts;
  };
}

export interface ApiDashboardFormation {
  id: string;
  name: string;
  is_published: boolean;
  total_enrollments: number;
  completion_rate: number;
  status_counts: DashboardStatusCounts;
}

export interface DashboardFormationsParams {
  q?: string;
  sort_by: DashboardFormationSort;
  page: number;
  per_page: number;
}

export interface ApiDashboardPage<T> {
  data: T[];
  meta: { total: number; page: number; per_page: number };
}

export interface ApiDashboardEnrollment {
  id: string;
  learner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  status: EnrollmentStatus;
  enrolled_at: string;
  /** 0 = première inscription ; les suivantes sont numérotées avant filtrage et pagination. */
  reenrollment_number: number;
}
