'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import FormationDetail from '@/modules/portal/resources/formation-detail/FormationDetail';
import { getFormationDetail } from '@/modules/portal/resources/formation-detail/lib/mock-data';
import { MOCK_FORMATIONS } from '@/modules/portal/resources/_shared/trainee/mock-data';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function FormationDetailPage({ params }: Props) {
  const { slug } = use(params);

  // Try to get full detail data
  let detail = getFormationDetail(slug);

  // Fallback: build a minimal detail from the formation-list mock data
  if (!detail) {
    const trainee = MOCK_FORMATIONS.find((c) => c.slug === slug);
    if (!trainee) notFound();
    detail = {
      slug: trainee.slug,
      title: trainee.title,
      status: trainee.status,
      category: trainee.category,
      level: 'Tous niveaux',
      description: trainee.description ?? '',
      coverImage: trainee.coverImage,
      progress: trainee.progress,
      completedModules: trainee.completedModules,
      totalModules: trainee.totalModules,
      totalDurationMin: trainee.totalModules * 30,
      lastActivity: trainee.lastActivity,
      hasCertificate: trainee.hasAttestation ?? false,
      modules: [],
      resources: [],
    };
  }

  return <FormationDetail formation={detail!} />;
}
