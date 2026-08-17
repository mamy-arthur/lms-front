import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchasedLearningPathKeys } from '@/shared/queries/keys';
import type { EnrollmentStatus } from '@/shared/types/enrollment.types';
import { purchasedLearningPathsManagementApi } from '../api';
import { ASSIGNABLE_LIST_PAGE_SIZE } from '../lib/constants';
import type { PurchasedLearningPathStatKey } from '../types';

const STAT_TO_STATUS: Record<PurchasedLearningPathStatKey, EnrollmentStatus | undefined> = {
  cumulative: undefined,
  inProgress: 'in_progress',
  notStarted: 'not_started',
};

/**
 * Récupère les enrollments d'un purchased-learning-path spécifique,
 * filtrés par statut selon la stat sélectionnée.
 * Activé uniquement quand `plpId` est fourni.
 */
export function usePurchasedLearningPathEnrollmentsQuery(
  plpId: string | null | undefined,
  stat: PurchasedLearningPathStatKey = 'cumulative',
) {
  const status = STAT_TO_STATUS[stat];

  const query = useQuery({
    queryKey: purchasedLearningPathKeys.enrollments(plpId ?? '', { status }),
    queryFn: () => {
      if (!plpId) return Promise.resolve({ data: [], total: 0 });
      return purchasedLearningPathsManagementApi.listEnrollments(plpId, {
        ...(status ? { status } : {}),
        per_page: ASSIGNABLE_LIST_PAGE_SIZE,
      });
    },
    enabled: Boolean(plpId),
    placeholderData: (prev) => prev,
  });

  const enrollments = useMemo(() => query.data?.data ?? [], [query.data]);

  return {
    enrollments,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
