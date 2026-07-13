import { useQuery } from '@tanstack/react-query';
import { adminCertificatesApi } from '../api';
import type { CertificateSearchParams } from '../types';
import { normalizeCertificate } from '../types';

export const ADMIN_CERTIFICATES_QUERY_KEY = ['admin', 'certificates'] as const;

export function useCertificatesQuery(params?: CertificateSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_CERTIFICATES_QUERY_KEY, params],
    queryFn: async () => {
      const { category, ...rest } = params ?? {};
      const apiParams: Record<string, unknown> = {
        ...rest,
        ...(category !== undefined ? { status: category } : {}),
      };
      const response = await adminCertificatesApi.list(apiParams);
      const raw = response.data ?? [];
      const data = raw.map((c) => normalizeCertificate(c));
      return { data, total: response.total ?? data.length };
    },
    placeholderData: (prev) => prev,
  });
}
