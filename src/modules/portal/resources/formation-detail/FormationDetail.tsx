'use client';

import { useRouter } from 'next/navigation';
import {
  Play,
  Clock,
  BookOpen,
  Timer,
  History,
  ClipboardCheck,
  FileText,
  Loader2,
} from 'lucide-react';
import type { FormationDetailData } from './lib/types';
import { ProgressVariant } from '@/shared/components/ui/progress/Progress';
import { Button } from '@/shared/components/ui/Button/Button';
import { useFormationSummaryQuery } from '../formation-learning/hooks/useFormationSummaryQuery';
import type { FormationModule, FormationEvaluation } from '../formation-learning/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FormationDetailProps {
  formation: FormationDetailData;
}

export default function FormationDetail({ formation }: FormationDetailProps) {
  const router = useRouter();
  const summaryQuery = useFormationSummaryQuery(formation.enrollmentId);

  const totalDurationH = Math.floor(formation.totalDurationMin / 60);
  const totalDurationM = formation.totalDurationMin % 60;
  const durationLabel =
    totalDurationM > 0 ? `${totalDurationH}h ${totalDurationM}m` : `${totalDurationH}h`;

  return (
    <div>
      <div className="mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-52 sm:h-72 md:h-100 w-full shrink-0 overflow-hidden">
              <img
                src={formation.coverImage}
                alt={formation.title}
                className="h-full w-full object-cover rounded-sm"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-col gap-5">
                <div className="space-y-1 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold text-slate-900">{formation.title}</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">{formation.description}</p>
                </div>
                <div className="space-y-5">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-sm bg-muted/40 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span className="text-xs font-medium">Modules</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {formation.completedModules}
                          <span className="text-sm font-normal"> / {formation.totalModules}</span>
                        </p>
                        <p className="text-xs">complétés</p>
                      </div>
                      <div className="rounded-sm bg-muted/40 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs font-medium">Temps passé</span>
                        </div>
                        <p className="text-lg font-semibold">{durationLabel}</p>
                        <p className="text-xs">sur la formation</p>
                      </div>
                      <div className="rounded-sm bg-muted/40 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          <span className="text-xs font-medium">Durée totale</span>
                        </div>
                        <p className="text-lg font-semibold">{formation.totalDurationMin} min</p>
                        <p className="text-xs">de contenu</p>
                      </div>
                      <div className="rounded-sm bg-muted/40 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          <span className="text-xs font-medium">Dernière activité</span>
                        </div>
                        <p className="text-lg font-semibold">{formation.lastActivity}</p>
                        <p className="text-xs">progression</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Progression</span>
                        <span className="font-semibold text-slate-800">{formation.progress}%</span>
                      </div>
                      <ProgressVariant value={formation.progress} className="h-2" />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => router.push(`/my-learning-paths/${formation.enrollmentId}/learn`)}
                  className="flex w-fit items-center gap-1 rounded-sm bg-(--color-primary)  text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all"
                >
                  <span>Accéder au cours</span>
                  <Play className="h-3 w-4 fill-white" />
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div>
              <div className="mb-3 flex flex-col">
                <p className="">Contenu de la formation</p>
                <span className="text-muted-foreground text-xs">
                  Voici la structure de la formation que vous allez suivre.
                </span>
              </div>
              {summaryQuery.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Chargement…
                </div>
              ) : (
                <div className="space-y-2">
                  {summaryQuery.isError && (
                    <p className="text-xs text-red-500">
                      Impossible de charger le contenu de la formation.
                    </p>
                  )}
                  {(summaryQuery.data?.nodes ?? []).map((node) => {
                    if (node.type === 'module') {
                      const mod = node as FormationModule;
                      return (
                        <Accordion
                          key={mod.id}
                          type="single"
                          collapsible
                          className="rounded-sm border"
                        >
                          <AccordionItem value={mod.id} className="border-none">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-xs">{mod.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-3">
                              <ul className="ml-5 space-y-2">
                                {mod.courses.map((course) => (
                                  <li key={course.id} className="flex items-center gap-1.5 text-sm">
                                    <FileText className="h-3 w-3 shrink-0" />
                                    {course.title}
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      );
                    }
                    const ev = node as FormationEvaluation;
                    return (
                      <div
                        key={ev.id}
                        className="flex items-center gap-2 rounded-sm border px-4 py-3"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                        <div>
                          <span className="text-sm font-medium">{ev.title}</span>
                          <span className="ml-2 text-xs">
                            {ev.evaluationType === 'final' ? 'Finale' : 'Intermédiaire'} · Score
                            requis : {ev.passingScore}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
