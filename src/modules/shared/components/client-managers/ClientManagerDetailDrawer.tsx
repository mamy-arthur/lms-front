'use client';

import { UserDetailDrawer, type UserDetailDrawerProps } from '../users/UserDetailDrawer';
import { ClientManagerDetailPage } from './ClientManagerDetailPage';

export function ClientManagerDetailDrawer(props: UserDetailDrawerProps) {
  return (
    <UserDetailDrawer
      {...props}
      namespace="client-manager-detail"
      title="Détail du responsable"
      description="Profil et formations achetées du responsable."
      closeLabel="Fermer le détail du responsable"
      page={ClientManagerDetailPage}
    />
  );
}
