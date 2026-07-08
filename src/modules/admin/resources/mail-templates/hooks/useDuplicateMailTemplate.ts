import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMailTemplatesApi } from '../api';
import { ADMIN_MAIL_TEMPLATES_QUERY_KEY } from './useMailTemplatesQuery';

export function useDuplicateMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminMailTemplatesApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MAIL_TEMPLATES_QUERY_KEY });
    },
  });
}
