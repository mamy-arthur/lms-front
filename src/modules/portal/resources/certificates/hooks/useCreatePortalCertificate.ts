import { useMutation, useQueryClient } from '@tanstack/react-query';
import { portalCertificatesApi } from '../api';
import type { CreateCertificatePayload } from '../types';
import { PORTAL_CERTIFICATES_QUERY_KEY } from './usePortalCertificatesQuery';

export function useCreatePortalCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCertificatePayload) => portalCertificatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTAL_CERTIFICATES_QUERY_KEY });
    },
  });
}
