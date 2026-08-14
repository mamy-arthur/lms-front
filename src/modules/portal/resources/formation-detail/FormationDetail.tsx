'use client';

import { useRouter } from 'next/navigation';
import { Play, Clock, BookOpen, Award, Sparkles, Timer, History } from 'lucide-react';
import type { FormationDetailData } from './lib/types';
import { ProgressVariant } from '@/shared/components/ui/progress/Progress';
import { Button } from '@/shared/components/ui/Button/Button';

interface FormationDetailProps {
  formation: FormationDetailData;
}

export default function FormationDetail({ formation }: FormationDetailProps) {
  const router = useRouter();

  const totalDurationH = Math.floor(formation.totalDurationMin / 60);
  const totalDurationM = formation.totalDurationMin % 60;
  const durationLabel =
    totalDurationM > 0 ? `${totalDurationH}h ${totalDurationM}m` : `${totalDurationH}h`;

  return (
    <div>
      <div className="mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
          <div className="space-y-5">
            <div className="overflow-hidden">
              <div className="flex flex-col gap-5">
                <div className="h-125 w-full shrink-0 overflow-hidden">
                  <img
                    src={formation.coverImage}
                    alt={formation.title}
                    className="h-full w-full object-cover rounded-sm"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 w-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold text-slate-900">{formation.title}</h1>
                      </div>
                      <p className="text-sm text-muted-foreground">{formation.description}</p>
                    </div>
                    <Button
                      onClick={() => router.push(`/my-learning-paths/${formation.slug}/learn`)}
                      className="flex w-fit items-center gap-1 rounded-sm bg-(--color-primary)  text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all"
                    >
                      <span>Accéder au cours</span>
                      <Play className="h-3 w-4 fill-white" />
                    </Button>
                  </div>
                  <div>
                    {formation.hasCertificate ? (
                      <div className="flex items-center gap-3 rounded-sm border border-slate-200 bg-slate-50 px-4 py-3">
                        <Award className="h-5 w-5 shrink-0 text-slate-500" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400">
                            Obtenez votre certification
                          </p>
                          <p className="text-sm text-slate-500">
                            Complétez cette formation pour décrocher votre certificat et booster vos
                            compétences.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-sm border border-slate-200 bg-slate-50 px-4 py-3">
                        <Sparkles className="h-5 w-5 shrink-0 text-slate-400" />
                        <p className="text-sm text-slate-500">
                          Cette formation ne délivre pas de certificat, mais elle reste une
                          excellente opportunité d&apos;enrichir vos compétences.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="rounded-sm border border-slate-100 bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Votre progression</h3>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Progression</span>
                  <span className="font-semibold text-slate-800">{formation.progress}%</span>
                </div>
                <ProgressVariant value={formation.progress} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-sm bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs font-medium">Modules</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {formation.completedModules}
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}
                      / {formation.totalModules}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">complétés</p>
                </div>
                <div className="rounded-sm bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Temps passé</span>
                  </div>
                  <p className="text-lg font-semibold">{durationLabel}</p>
                  <p className="text-xs text-muted-foreground">sur la formation</p>
                </div>
                <div className="rounded-sm bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span className="text-xs font-medium">Durée totale</span>
                  </div>
                  <p className="text-lg font-semibold">8h</p>
                  <p className="text-xs text-muted-foreground">de contenu</p>
                </div>
                <div className="rounded-sm bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <History className="h-4 w-4" />
                    <span className="text-xs font-medium">Dernière activité</span>
                  </div>
                  <p className="text-lg font-semibold">{formation.lastActivity}</p>
                  <p className="text-xs text-muted-foreground">progression</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
