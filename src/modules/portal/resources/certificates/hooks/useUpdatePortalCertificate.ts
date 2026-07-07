import { useMutation, useQueryClient } from '@tanstack/react-query';
import { portalCertificatesApi } from '../api';
import type { Certificate, UpdateCertificatePayload } from '../types';
import { normalizeCertificate } from '../types';
import { PORTAL_CERTIFICATES_QUERY_KEY } from './usePortalCertificatesQuery';

export function useUpdatePortalCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCertificatePayload }) =>
      portalCertificatesApi.update(id, data),
    onSuccess: ({ data: rawCert }) => {
      const updated = normalizeCertificate(rawCert as Record<string, unknown>);
      queryClient.setQueryData<{ data: Certificate[]; total: number }>(
        PORTAL_CERTIFICATES_QUERY_KEY,
        (prev) => ({
          data: (prev?.data ?? []).map((c) => (c.id === updated.id ? updated : c)),
          total: prev?.total ?? 0,
        }),
      );
    },
  });
}
