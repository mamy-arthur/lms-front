import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMailTemplatesApi } from '../api';
import type { CreateMailTemplatePayload } from '../types';
import { ADMIN_MAIL_TEMPLATES_QUERY_KEY } from './useMailTemplatesQuery';

export function useCreateMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMailTemplatePayload) => adminMailTemplatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_MAIL_TEMPLATES_QUERY_KEY,
      });
    },
  });
}
