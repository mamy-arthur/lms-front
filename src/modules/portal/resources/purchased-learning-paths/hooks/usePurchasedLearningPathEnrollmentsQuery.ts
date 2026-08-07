import { useQuery } from "@tanstack/react-query";
import { purchasedLearningPathKeys } from "@/shared/queries/keys";
import type { EnrollmentStatus } from "@/shared/types/enrollment.types";
import { purchasedLearningPathsManagementApi } from "../api";
import { mapEnrollmentToRow } from "../lib/mappers";
import type { PurchasedLearningPathStatKey } from "../types";
import { useAssignableTraineesQuery } from "./useAssignableTraineesQuery";

const STAT_TO_STATUS: Record<
  PurchasedLearningPathStatKey,
  EnrollmentStatus | undefined
> = {
  cumulative: undefined,
  inProgress: "in_progress",
  notStarted: "not_started",
};

/**
 * Récupère les enrollments d'un purchased-learning-path spécifique,
 * filtrés par statut selon la stat sélectionnée.
 * Activé uniquement quand `plpId` est fourni.
 */
export function usePurchasedLearningPathEnrollmentsQuery(
  plpId: string | null | undefined,
  stat: PurchasedLearningPathStatKey = "cumulative",
) {
  const status = STAT_TO_STATUS[stat];
  const { data: trainees = [] } = useAssignableTraineesQuery();

  const query = useQuery({
    queryKey: purchasedLearningPathKeys.enrollments(plpId ?? "", { status }),
    queryFn: () => {
      if (!plpId) return Promise.resolve([]);
      return purchasedLearningPathsManagementApi.listEnrollments(plpId, {
        ...(status ? { status } : {}),
        per_page: 100,
      });
    },
    enabled: Boolean(plpId),
    placeholderData: (prev) => prev,
  });

  const usersById = new Map(trainees.map((u) => [u.id, u]));

  const enrollments = (query.data ?? []).map((e) =>
    mapEnrollmentToRow(e, usersById),
  );

  return {
    enrollments,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
