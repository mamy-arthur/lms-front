'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Play, Clock, BookOpen, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormationDetailData } from './lib/types';
import { ProgressRing } from './components/ProgressRing';
import { ModuleAccordion } from './components/ModuleAccordion';

const TABS = ['Contenu de la formation', 'À propos'] as const;
type Tab = (typeof TABS)[number];

interface FormationDetailProps {
  formation: FormationDetailData;
}

export default function FormationDetail({ formation }: FormationDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Contenu de la formation');

  const totalDurationH = Math.floor(formation.totalDurationMin / 60);
  const totalDurationM = formation.totalDurationMin % 60;
  const durationLabel =
    totalDurationM > 0 ? `${totalDurationH}h ${totalDurationM}m` : `${totalDurationH}h`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour à mes formations
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="h-44 w-full shrink-0 overflow-hidden rounded-xl sm:h-auto sm:w-56">
                  <img
                    src={formation.coverImage}
                    alt={formation.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-sm font-bold text-slate-900">{formation.title}</h1>
                        <span className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                          En cours
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {formation.category} &bull; Niveau {formation.level}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push(`/mes-formations/${formation.slug}/learn`)}
                      className="flex shrink-0 items-center gap-1 rounded-xl bg-[var(--color-primary)] px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
                    >
                      Continuer <Play className="h-2 w-3 fill-white" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">{formation.description}</p>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-700"
                        style={{ width: `${formation.progress}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-sm font-bold text-slate-600">
                      {formation.progress}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 border-t border-slate-50 pt-3">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      {formation.completedModules} / {formation.totalModules} modules complétés
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {durationLabel} de contenu
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      Certificat à la clé
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-1 border-b border-slate-100">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px',
                    activeTab === tab
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-slate-500 hover:text-slate-700',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Contenu de la formation' && (
              <div className="space-y-3">
                {formation.modules.map((module) => (
                  <ModuleAccordion key={module.id} module={module} />
                ))}
              </div>
            )}
            {activeTab === 'À propos' && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-xs text-slate-600 shadow-sm">
                <p>{formation.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800">Votre progression</h3>
              <div className="flex justify-center">
                <ProgressRing progress={formation.progress} />
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    Modules complétés
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formation.completedModules} / {formation.totalModules}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Temps passé
                  </span>
                  <span className="font-semibold text-slate-800">{durationLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Dernière activité
                  </span>
                  <span className="font-semibold text-slate-800">{formation.lastActivity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Award className="h-4 w-4 text-slate-400" />
                    Certificat
                  </span>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      formation.progress === 100 ? 'text-green-600' : 'text-[var(--color-primary)]',
                    )}
                  >
                    {formation.progress === 100 ? 'Disponible' : 'Disponible à 100%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
