import { redirect } from 'next/navigation';
import { traineeDrawerPath } from '@/modules/shared/lib/traineeDetailNavigation';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  redirect(traineeDrawerPath('admin', id, typeof returnTo === 'string' ? returnTo : undefined));
}
