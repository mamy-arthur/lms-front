'use client';

import { use } from 'react';
import FormationPlayer from '@/modules/portal/resources/formation-learning/FormationPlayer';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function FormationPlayerPage({ params }: Props) {
  const { slug } = use(params);
  return <FormationPlayer learningPathId={slug} />;
}
