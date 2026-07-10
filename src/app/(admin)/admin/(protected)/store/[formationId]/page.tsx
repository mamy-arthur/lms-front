import { notFound } from 'next/navigation';

import { FormationDetailsPage } from '@/modules/portal/resources/store/FormationDetailsPage';
import { getStoreFormationDetailsById } from '@/shared/mocks/store.mock';

interface PageProps {
  params: Promise<{
    formationId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { formationId } = await params;
  const formation = getStoreFormationDetailsById(formationId);

  if (!formation) {
    notFound();
  }

  return <FormationDetailsPage formation={formation} backHref="/admin/store" />;
}
