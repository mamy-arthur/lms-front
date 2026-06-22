import { useQuery } from "@tanstack/react-query";
import { MOCK_CERTIFICATES } from "@modules/shared/components/certificates/mocks/certificates.mock";
import type { CertificateSearchParams } from "../types";
import { normalizeCertificate } from "../types";

export const ADMIN_CERTIFICATES_QUERY_KEY = ["admin", "certificates"] as const;

export function useCertificatesQuery(params?: CertificateSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_CERTIFICATES_QUERY_KEY, params],
    queryFn: () => {
      const data = MOCK_CERTIFICATES.map((c) => normalizeCertificate(c));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
