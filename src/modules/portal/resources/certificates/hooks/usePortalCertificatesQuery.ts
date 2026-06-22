import { useQuery } from "@tanstack/react-query";
import { MOCK_CERTIFICATES } from "@modules/shared/components/certificates/mocks/certificates.mock";
import type { CertificateSearchParams } from "../types";
import { normalizeCertificate } from "../types";

export const PORTAL_CERTIFICATES_QUERY_KEY = [
  "portal",
  "certificates",
] as const;

export function usePortalCertificatesQuery(params?: CertificateSearchParams) {
  return useQuery({
    queryKey: [...PORTAL_CERTIFICATES_QUERY_KEY, params],
    queryFn: () => {
      const data = MOCK_CERTIFICATES.map((c) => normalizeCertificate(c));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
