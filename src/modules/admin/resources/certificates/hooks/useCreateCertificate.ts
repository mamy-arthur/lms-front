import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Certificate, CreateCertificatePayload } from "../types";
import { normalizeCertificate } from "../types";
import { ADMIN_CERTIFICATES_QUERY_KEY } from "./useCertificatesQuery";

export function useCreateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCertificatePayload) => {
      const mockRaw: Record<string, unknown> = {
        id: `cert-${Date.now()}`,
        name: data.name,
        is_active: data.is_active ?? true,
        is_default_template: data.is_default_template ?? false,
        body: data.body ?? "",
        tenant_id: data.tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve({ data: mockRaw });
    },
    onSuccess: ({ data: rawCert }) => {
      const newCert = normalizeCertificate(rawCert as Record<string, unknown>);
      queryClient.setQueryData<{ data: Certificate[]; total: number }>(
        ADMIN_CERTIFICATES_QUERY_KEY,
        (prev) => ({
          data: [newCert, ...(prev?.data ?? [])],
          total: (prev?.total ?? 0) + 1,
        }),
      );
    },
  });
}
