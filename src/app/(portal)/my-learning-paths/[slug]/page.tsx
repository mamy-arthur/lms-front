'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import FormationDetail from '@/modules/portal/resources/formation-detail/FormationDetail';
import { useMyEnrollmentsQuery } from '@/modules/portal/resources/formation-list/hooks/useMyEnrollmentsQuery';
import type { FormationDetailData } from '@/modules/portal/resources/formation-detail/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function FormationDetailPage({ params }: Props) {
  const { slug } = use(params);
  const { data: formations = [], isLoading } = useMyEnrollmentsQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-sm" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  const trainee = formations.find((c) => c.slug === slug);
  if (!trainee) notFound();

  const detail: FormationDetailData = {
    slug: trainee.slug,
    title: trainee.title,
    enrollmentId: trainee.id, // the enrollmentId is used to access the learning path
    status: trainee.status,
    category: trainee.category,
    level: 'Tous niveaux',
    description: trainee.description ?? '',
    coverImage: trainee.coverImage,
    progress: trainee.progress,
    completedModules: 0,
    totalModules: trainee.totalModules,
    totalDurationMin: trainee.totalDurationMin,
    lastActivity: trainee.lastActivity,
    hasCertificate: trainee.hasAttestation ?? false,
    modules: [],
    resources: [],
  };

  return <FormationDetail formation={detail} />;
}
