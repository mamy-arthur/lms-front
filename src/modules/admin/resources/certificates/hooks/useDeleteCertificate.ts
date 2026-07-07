import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCertificatesApi } from "../api";
import type { Certificate } from "../types";
import { ADMIN_CERTIFICATES_QUERY_KEY } from "./useCertificatesQuery";

export function useDeleteCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminCertificatesApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<{ data: Certificate[]; total: number }>(
        ADMIN_CERTIFICATES_QUERY_KEY,
        (prev) => ({
          data: (prev?.data ?? []).filter((c) => c.id !== id),
          total: Math.max(0, (prev?.total ?? 0) - 1),
        }),
      );
    },
  });
}
