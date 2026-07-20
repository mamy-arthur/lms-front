import { useQuery } from '@tanstack/react-query';
import { adminCertificatesApi } from '../api';
import type { CertificateSearchParams } from '../types';
import { normalizeCertificate } from '../types';
import { buildResourceQueryParams } from '@/lib/buildResourceQueryParams';

export const ADMIN_CERTIFICATES_QUERY_KEY = ['admin', 'certificates'] as const;

export function useCertificatesQuery(params?: CertificateSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_CERTIFICATES_QUERY_KEY, params],
    queryFn: async () => {
      const response = await adminCertificatesApi.list(
        buildResourceQueryParams(params as Record<string, unknown>),
      );
      const raw = response.data ?? [];
      const data = raw.map((c) => normalizeCertificate(c));
      return { data, total: response.total ?? data.length };
    },
    placeholderData: (prev) => prev,
  });
}
