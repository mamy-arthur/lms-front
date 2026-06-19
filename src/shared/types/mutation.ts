export interface MutationLike {
  mutate: (...args: any[]) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}
