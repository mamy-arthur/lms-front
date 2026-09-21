import { useQuery } from '@tanstack/react-query';
import { meApi } from '@/shared/api/portal.api';
import { portalMyEnrollmentsKeys } from '@/shared/queries/keys';
import type { ApiMeEnrollment } from '@/shared/types/enrollment.types';
import type {
  TraineeFormation,
  FormationStatus,
} from '@/modules/portal/resources/_shared/trainee/types';

export interface MyEnrollmentsQueryParams {
  page?: number;
  per_page?: number;
  q?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  category_id?: string;
}

function formatRelativeDate(isoDate: string): string {
  const diffDays = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 14) return 'il y a 1 semaine';
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const STATUS_MAP: Record<string, FormationStatus> = {
  not_started: 'not_started',
  in_progress: 'in_progress',
  completed: 'completed',
  expired: 'not_started',
  failed: 'failed',
};

function normalizeEnrollment(api: ApiMeEnrollment): TraineeFormation {
  return {
    id: api.id,
    slug: api.id, // enrollment ID — unique even for re-enrollments to the same LP
    title: api.learning_path.name,
    description: api.learning_path.description,
    category: api.learning_path.category_learning_path?.name ?? '',
    coverImage: api.learning_path.image?.url ?? '',
    progress: api.progress_percent ?? 0,
    completedModules: 0,
    totalModules: api.learning_path.totalModules ?? 0,
    totalDurationMin: api.learning_path.duration ?? 0,
    status: STATUS_MAP[api.status] ?? 'not_started',
    enrolledAt: api.enrolled_at,
    lastActivity: formatRelativeDate(api.created_at),
    completedDate: api.completed_at
      ? new Date(api.completed_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : undefined,
    failureReason: api.failure_reason,
    failedAt: api.failed_at
      ? new Date(api.failed_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : undefined,
    hasAttestation: false,
  };
}

export function useMyEnrollmentsQuery(params: MyEnrollmentsQueryParams = {}) {
  return useQuery({
    queryKey: [...portalMyEnrollmentsKeys.all, params],
    queryFn: async () => {
      const response = await meApi.enrollments(params);
      return {
        data: response.data.map(normalizeEnrollment),
        total: response.meta.total,
      };
    },
    placeholderData: (prev) => prev,
  });
}
