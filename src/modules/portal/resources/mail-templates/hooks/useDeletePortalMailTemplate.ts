import { useMutation, useQueryClient } from '@tanstack/react-query';
import { portalMailTemplatesApi } from '../api';
import { PORTAL_MAIL_TEMPLATES_QUERY_KEY } from './usePortalMailTemplatesQuery';

export function useDeletePortalMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => portalMailTemplatesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTAL_MAIL_TEMPLATES_QUERY_KEY });
    },
  });
}
