import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "@/shared/api/enrollments.api";
import { enrollmentKeys } from "@/shared/queries/keys";
import type { ApiEnrollment } from "@/shared/types/enrollment.types";
import { ASSIGNABLE_LIST_PAGE_SIZE } from "../lib/constants";

/**
 * Récupère les enrollments du CM authentifié (page 1, max 100).
 *
 * LIMITATION : L'API plafonne per_page à 100. Au-delà, les enrollments
 * supplémentaires ne sont pas chargés, ce qui peut fausser les stats de la table
 * et le filtre "déjà inscrits" dans le drawer. Une évolution vers un comptage
 * côté serveur (inclus dans la réponse purchased-learning-paths) est nécessaire.
 */
export function useEnrollmentsQuery() {
  return useQuery({
    queryKey: enrollmentKeys.list({
      page: 1,
      per_page: ASSIGNABLE_LIST_PAGE_SIZE,
    }),
    queryFn: async (): Promise<ApiEnrollment[]> => {
      const response = await enrollmentsApi.list({
        page: 1,
        per_page: ASSIGNABLE_LIST_PAGE_SIZE,
      });
      return response.data;
    },
    placeholderData: (prev) => prev,
  });
}
