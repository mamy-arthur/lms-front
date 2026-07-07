import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCertificatesApi } from '../api';
import { ADMIN_CERTIFICATES_QUERY_KEY } from './useCertificatesQuery';

export function useDeleteCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminCertificatesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CERTIFICATES_QUERY_KEY });
    },
  });
}
