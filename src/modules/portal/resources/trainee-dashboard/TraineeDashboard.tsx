'use client';

import { useAuthStore } from '@/shared/stores/auth.store';
import { useRouter } from 'next/navigation';
import { KpiStatsRow } from './components/KpiStatsRow';
import { FeaturedFormationCard } from './components/FeaturedFormationCard';
import { FormationCard } from '@/modules/portal/resources/_shared/trainee/FormationCard';
import {
  MOCK_FORMATIONS,
  FEATURED_FORMATION,
  LEARNING_STATS,
} from '@/modules/portal/resources/_shared/trainee/mock-data';

export default function TraineeDashboard() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const firstName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Stagiaire';

  const previewFormations = MOCK_FORMATIONS.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour, {firstName}</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Continuez votre apprentissage et atteignez vos objectifs.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <FeaturedFormationCard formation={FEATURED_FORMATION} />
          <div className="grid grid-cols-3 gap-5">
            <KpiStatsRow stats={LEARNING_STATS} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Mes formations</h2>
            <button
              type="button"
              onClick={() => router.push('/trainee/formations')}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              Voir tout
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {previewFormations.map((formation) => (
              <FormationCard key={formation.id} formation={formation} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
