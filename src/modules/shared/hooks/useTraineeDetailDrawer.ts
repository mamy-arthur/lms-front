'use client';

import { useUserDetailDrawer } from './useUserDetailDrawer';

export function useTraineeDetailDrawer(path: string) {
  return useUserDetailDrawer(path, 'trainee');
}
