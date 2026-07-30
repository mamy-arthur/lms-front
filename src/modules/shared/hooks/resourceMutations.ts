import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MutationMessages {
  success?: string;
  error?: string;
}

const DEFAULT_ERROR = 'Une erreur est survenue';

interface ResourceApi<TCreate, TUpdate> {
  create: (data: TCreate) => Promise<unknown>;
  update: (id: string, data: TUpdate) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  duplicate: (id: string) => Promise<unknown>;
  uploadMedia: (
    file: File,
  ) => Promise<{ data: { id: string; url: string; mime_type: string; original_name: string } }>;
}

/**
 * Factories de mutations CRUD réutilisables.
 * Chaque hook module reste un fichier indépendant mais appelle l'une de ces fonctions.
 */

export function makeCreateMutation<TCreate>(
  api: Pick<ResourceApi<TCreate, unknown>, 'create'>,
  queryKey: readonly unknown[],
  messages?: MutationMessages,
) {
  return function useCreateResource() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: TCreate) => api.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        if (messages?.success) toast.success(messages.success);
      },
      onError: () => toast.error(messages?.error ?? DEFAULT_ERROR),
    });
  };
}

export function makeUpdateMutation<TUpdate>(
  api: Pick<ResourceApi<unknown, TUpdate>, 'update'>,
  queryKey: readonly unknown[],
  messages?: MutationMessages,
) {
  return function useUpdateResource() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdate }) => api.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        if (messages?.success) toast.success(messages.success);
      },
      onError: () => toast.error(messages?.error ?? DEFAULT_ERROR),
    });
  };
}

export function makeDeleteMutation(
  api: Pick<ResourceApi<unknown, unknown>, 'remove'>,
  queryKey: readonly unknown[],
  messages?: MutationMessages,
) {
  return function useDeleteResource() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.remove(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        if (messages?.success) toast.success(messages.success);
      },
      onError: () => toast.error(messages?.error ?? DEFAULT_ERROR),
    });
  };
}

export function makeDuplicateMutation(
  api: Pick<ResourceApi<unknown, unknown>, 'duplicate'>,
  queryKey: readonly unknown[],
  messages?: MutationMessages,
) {
  return function useDuplicateResource() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.duplicate(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        if (messages?.success) toast.success(messages.success);
      },
      onError: () => toast.error(messages?.error ?? DEFAULT_ERROR),
    });
  };
}

export function makeToggleActiveMutation(
  api: Pick<ResourceApi<unknown, { is_active: boolean }>, 'update'>,
  queryKey: readonly unknown[],
  messages?: MutationMessages,
) {
  return function useToggleActiveResource() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
        api.update(id, { is_active }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        if (messages?.success) toast.success(messages.success);
      },
      onError: () => toast.error(messages?.error ?? DEFAULT_ERROR),
    });
  };
}

export function makeUploadMediaMutation(api: Pick<ResourceApi<unknown, unknown>, 'uploadMedia'>) {
  return function useUploadMediaResource() {
    return useMutation({
      mutationFn: (file: File) => api.uploadMedia(file),
    });
  };
}
