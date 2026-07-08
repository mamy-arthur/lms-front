import { useMutation, useQueryClient } from '@tanstack/react-query';
import { portalMailTemplatesApi } from '../api';
import type { CreateMailTemplatePayload } from '../types';
import { PORTAL_MAIL_TEMPLATES_QUERY_KEY } from './usePortalMailTemplatesQuery';

export function useCreatePortalMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMailTemplatePayload) => portalMailTemplatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PORTAL_MAIL_TEMPLATES_QUERY_KEY,
      });
    },
  });
}
