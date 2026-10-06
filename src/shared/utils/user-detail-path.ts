import type { UserDetailArea } from '@/shared/types/user-detail.types';

export const userDetailPath = (area: UserDetailArea, id: string) =>
  `${area === 'admin' ? 'platform/' : ''}users/${encodeURIComponent(id)}`;
