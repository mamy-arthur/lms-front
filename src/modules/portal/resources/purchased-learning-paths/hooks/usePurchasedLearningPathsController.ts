import { useMemo } from 'react';
import type {
  PurchasedLearningPath,
  PurchasedLearningPathRow,
  PurchasedLearningPathStats,
} from '../types';

function buildPurchasedLearningPathStats(plp: PurchasedLearningPath): PurchasedLearningPathStats {
  return {
    cumulative:
      Number(plp.enrollmentsNotStartedCount) +
      Number(plp.enrollmentsInProgressCount) +
      Number(plp.enrollmentsCompletedCount) +
      Number(plp.enrollmentsExpiredCount) +
      Number(plp.enrollmentsFailedCount),
    inProgress: Number(plp.enrollmentsInProgressCount),
    notStarted: Number(plp.enrollmentsNotStartedCount),
    failed: Number(plp.enrollmentsFailedCount),
    availableCredits: Number(plp.creditsAvailable),
  };
}

interface UsePurchasedLearningPathsControllerInput {
  purchasedLearningPaths: PurchasedLearningPath[];
}

export function usePurchasedLearningPathsController({
  purchasedLearningPaths,
}: UsePurchasedLearningPathsControllerInput) {
  const purchasedLearningPathRows = useMemo<PurchasedLearningPathRow[]>(
    () =>
      purchasedLearningPaths.map((plp) => ({
        ...plp,
        stats: buildPurchasedLearningPathStats(plp),
      })),
    [purchasedLearningPaths],
  );

  return { purchasedLearningPathRows } as const;
}
