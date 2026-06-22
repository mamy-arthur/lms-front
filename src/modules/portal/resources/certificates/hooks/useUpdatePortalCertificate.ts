import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Certificate, UpdateCertificatePayload } from "../types";
import { normalizeCertificate } from "../types";
import { PORTAL_CERTIFICATES_QUERY_KEY } from "./usePortalCertificatesQuery";

export function useUpdatePortalCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCertificatePayload;
    }) => {
      const mockRaw: Record<string, unknown> = {
        id,
        name: data.name,
        is_active: data.is_active,
        is_default_template: data.is_default_template,
        body: data.body ?? "",
        tenant_id: data.tenant_id,
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve({ data: mockRaw });
    },
    onSuccess: ({ data: rawCert }) => {
      const updated = normalizeCertificate(rawCert as Record<string, unknown>);
      queryClient.setQueryData<{ data: Certificate[]; total: number }>(
        PORTAL_CERTIFICATES_QUERY_KEY,
        (prev) => ({
          data: (prev?.data ?? []).map((c) =>
            c.id === updated.id ? updated : c,
          ),
          total: prev?.total ?? 0,
        }),
      );
    },
  });
}
