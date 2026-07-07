import { useMutation, useQueryClient } from '@tanstack/react-query';
import { portalCertificatesApi } from '../api';
import { PORTAL_CERTIFICATES_QUERY_KEY } from './usePortalCertificatesQuery';

export function useDuplicatePortalCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => portalCertificatesApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTAL_CERTIFICATES_QUERY_KEY });
    },
  });
}
