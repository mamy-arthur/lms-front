import { redirect } from 'next/navigation';
import { ROUTES } from '@/shared/constants/routes';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(ROUTES.portal.traineeDetail(id));
}
