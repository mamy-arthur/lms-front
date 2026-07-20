import { useQuery } from '@tanstack/react-query';
import { portalCertificatesApi } from '../api';
import type { CertificateSearchParams } from '../types';
import { normalizeCertificate } from '../types';
import { buildResourceQueryParams } from '@/lib/buildResourceQueryParams';

export const PORTAL_CERTIFICATES_QUERY_KEY = ['portal', 'certificates'] as const;

export function usePortalCertificatesQuery(params?: CertificateSearchParams) {
  return useQuery({
    queryKey: [...PORTAL_CERTIFICATES_QUERY_KEY, params],
    queryFn: async () => {
      const response = await portalCertificatesApi.list(
        buildResourceQueryParams(params as Record<string, unknown>),
      );
      const raw = response.data ?? [];
      const data = raw.map((c) => normalizeCertificate(c));
      return { data, total: response.total ?? data.length };
    },
    placeholderData: (prev) => prev,
  });
}
