import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { portalMailTemplatesApi } from '../api';
import type { UpdateMailTemplatePayload } from '../types';
import { PORTAL_MAIL_TEMPLATES_QUERY_KEY } from './usePortalMailTemplatesQuery';

export function useUpdatePortalMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMailTemplatePayload }) =>
      portalMailTemplatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PORTAL_MAIL_TEMPLATES_QUERY_KEY,
      });
      toast.success('Template mis à jour');
    },
    onError: () => toast.error('Échec de la mise à jour du template'),
  });
}
