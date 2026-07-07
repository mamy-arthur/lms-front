import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalCertificatesApi } from "../api";
import type { Certificate } from "../types";
import { PORTAL_CERTIFICATES_QUERY_KEY } from "./usePortalCertificatesQuery";

export function useDeletePortalCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => portalCertificatesApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<{ data: Certificate[]; total: number }>(
        PORTAL_CERTIFICATES_QUERY_KEY,
        (prev) => ({
          data: (prev?.data ?? []).filter((c) => c.id !== id),
          total: Math.max(0, (prev?.total ?? 0) - 1),
        }),
      );
    },
  });
}
