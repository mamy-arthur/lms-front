import { useMutation, useQueryClient } from '@tanstack/react-query';
import { portalCertificatesApi } from '../api';
import type { UpdateCertificatePayload } from '../types';
import { PORTAL_CERTIFICATES_QUERY_KEY } from './usePortalCertificatesQuery';

export function useUpdatePortalCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCertificatePayload }) =>
      portalCertificatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTAL_CERTIFICATES_QUERY_KEY });
    },
  });
}
