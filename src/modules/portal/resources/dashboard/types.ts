import type { EnrollmentStatus } from '@/shared/types/enrollment.types';

export interface ClientDashboardOverview {
  learning_paths: number;
  enrollments: {
    completed: number;
    in_progress: number;
    not_started: number;
    failed: number;
    expired: number;
    total: number;
  };
}

export interface ApiClientDashboardStudent {
  id: string;
  learner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  learning_path: { id: string; name: string };
  status: EnrollmentStatus;
  progress_percent: number;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  ended_at: string | null;
  expires_at: string | null;
}

export interface DashboardStudent {
  id: string;
  name: string;
  email: string | null;
  initials: string;
  avatarUrl?: string;
  courseId: string;
  course: string;
  progress: number;
  status: EnrollmentStatus;
  startedAt: string | null;
  endedAt: string | null;
  deadline?: string;
}

export function normalizeClientStudent(row: ApiClientDashboardStudent): DashboardStudent {
  const name = [row.learner.first_name, row.learner.last_name].filter(Boolean).join(' ');
  return {
    id: row.id,
    name: name || row.learner.email || 'Apprenant',
    email: row.learner.email,
    initials:
      [row.learner.first_name, row.learner.last_name]
        .filter(Boolean)
        .map((part) => part!.charAt(0))
        .join('')
        .toUpperCase() || '?',
    courseId: row.learning_path.id,
    course: row.learning_path.name,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    progress: row.progress_percent,
    status: row.status,
    deadline: row.expires_at?.slice(0, 10),
  };
}
