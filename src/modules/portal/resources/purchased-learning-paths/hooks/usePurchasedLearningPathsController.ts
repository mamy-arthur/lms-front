import { useMemo } from "react";
import type {
  PurchasedLearningPath,
  PurchasedLearningPathRow,
  PurchasedLearningPathStats,
} from "../types";

function buildPurchasedLearningPathStats(
  plp: PurchasedLearningPath,
): PurchasedLearningPathStats {
  return {
    cumulative:
      plp.enrollmentsNotStartedCount +
      plp.enrollmentsInProgressCount +
      plp.enrollmentsCompletedCount +
      plp.enrollmentsExpiredCount,
    inProgress: plp.enrollmentsInProgressCount,
    notStarted: plp.enrollmentsNotStartedCount,
    availableCredits: plp.creditsAvailable,
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
