import { ROUTES } from '@/shared/constants/routes';
import type { TraineeDetailArea } from '@/shared/types/trainee-detail.types';

export function traineeDrawerPath(area: TraineeDetailArea, id: string, returnTo?: string) {
  const path = area === 'admin' ? ROUTES.admin.users : ROUTES.portal.users;
  const search = returnTo?.startsWith(`${path}?`) ? returnTo.slice(path.length + 1) : '';
  const query = new URLSearchParams(search);
  query.set('trainee', id);
  return `${path}?${query}`;
}
