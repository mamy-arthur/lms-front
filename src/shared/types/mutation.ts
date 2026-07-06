/* eslint-disable @typescript-eslint/no-explicit-any */
export interface MutationLike {
  mutate: (variables: any, options?: { onSuccess?: () => void }) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}
