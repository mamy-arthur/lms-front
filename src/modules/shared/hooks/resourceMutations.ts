import { useMutation, useQueryClient } from '@tanstack/react-query';

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
) {
  return function useCreateResource() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: TCreate) => api.create(data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
  };
}

export function makeUpdateMutation<TUpdate>(
  api: Pick<ResourceApi<unknown, TUpdate>, 'update'>,
  queryKey: readonly unknown[],
) {
  return function useUpdateResource() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdate }) => api.update(id, data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
  };
}

export function makeDeleteMutation(
  api: Pick<ResourceApi<unknown, unknown>, 'remove'>,
  queryKey: readonly unknown[],
) {
  return function useDeleteResource() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.remove(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
  };
}

export function makeDuplicateMutation(
  api: Pick<ResourceApi<unknown, unknown>, 'duplicate'>,
  queryKey: readonly unknown[],
) {
  return function useDuplicateResource() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.duplicate(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
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
