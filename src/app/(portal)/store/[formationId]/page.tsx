'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { FormationDetailsPage } from '@/modules/portal/resources/store/FormationDetailsPage';
import { useShopLearningPathQuery } from '@/modules/portal/resources/store/hooks/useShopLearningPathQuery';
import { Skeleton } from '@/components/ui/skeleton';
import type { StoreFormationDetails } from '@/shared/mocks/store.mock';
import type { ApiLearningPath } from '@/shared/types/learning-path.types';

function toFormationDetails(lp: ApiLearningPath): StoreFormationDetails {
  return {
    id: lp.id,
    title: lp.name,
    author: '',
    category: '',
    categoryId: lp.category_id ?? '',
    coverImage: lp.image?.url,
    price: lp.price ?? 0,
    updatedAt: lp.updated_at,
    enrolledCompanies: 0,
    moduleCount: lp.competencies.length,
    evaluationCount: 0,
    shortDescription: lp.description ?? '',
    fullDescription: lp.description ?? '',
    level: 'Débutant',
    duration: '',
    language: 'Français',
    certificate: false,
    learningObjectives: [],
    programSteps: [],
    courseCount: lp.competencies.length,
  };
}

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

  return <FormationDetailsPage formation={toFormationDetails(data)} />;
}
