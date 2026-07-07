import { useMutation, useQueryClient } from '@tanstack/react-query';
import { portalCertificatesApi } from '../api';
import type { Certificate, CreateCertificatePayload } from '../types';
import { normalizeCertificate } from '../types';
import { PORTAL_CERTIFICATES_QUERY_KEY } from './usePortalCertificatesQuery';

export function useCreatePortalCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCertificatePayload) => portalCertificatesApi.create(data),
    onSuccess: ({ data: rawCert }) => {
      const newCert = normalizeCertificate(rawCert as Record<string, unknown>);
      queryClient.setQueryData<{ data: Certificate[]; total: number }>(
        PORTAL_CERTIFICATES_QUERY_KEY,
        (prev) => ({
          data: [newCert, ...(prev?.data ?? [])],
          total: (prev?.total ?? 0) + 1,
        }),
      );
    },
  });
}
