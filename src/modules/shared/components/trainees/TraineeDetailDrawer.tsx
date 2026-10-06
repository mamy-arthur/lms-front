'use client';

import { UserDetailDrawer, type UserDetailDrawerProps } from '../users/UserDetailDrawer';
import { TraineeDetailPage } from './TraineeDetailPage';

export function TraineeDetailDrawer(props: UserDetailDrawerProps) {
  return (
    <UserDetailDrawer
      {...props}
      namespace="trainee-detail"
      title="Détail du stagiaire"
      description="Profil et suivi des formations du stagiaire."
      closeLabel="Fermer le détail du stagiaire"
      page={TraineeDetailPage}
    />
  );
}
