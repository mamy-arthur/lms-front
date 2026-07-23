'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { FormationDetailsPage } from '@/modules/portal/resources/store/FormationDetailsPage';
import { useShopLearningPathQuery } from '@/modules/portal/resources/store/hooks/useShopLearningPathQuery';
import { toShopFormationDetails } from '@/shared/lib/shop-formation';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ formationId: string }>;
}

export default function Page({ params }: PageProps) {
  const { formationId } = use(params);
  const { data, isLoading, isError } = useShopLearningPathQuery(formationId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (isError || !data) {
    notFound();
  }

  return <FormationDetailsPage formation={toShopFormationDetails(data)} />;
}
