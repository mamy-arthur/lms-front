'use client';

import { useRouter } from 'next/navigation';
import { Award, ClipboardCheck, Clock, GraduationCap, History, Layers, Play } from 'lucide-react';
import type { FormationDetailData } from './lib/types';
import { ProgressVariant } from '@/shared/components/ui/progress/Progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormationSummaryQuery } from '../formation-learning/hooks/useFormationSummaryQuery';
import type { FormationEvaluation, FormationModule } from '../formation-learning/lib/types';
import { formatDuration } from '@/shared/lib/duration';
import CurriculumModule from './components/CurriculumModule';
import { learningPathCover } from '@/shared/lib/learning-path-cover';

interface FormationDetailProps {
  formation: FormationDetailData;
}

const STATUS_BADGE: Record<FormationDetailData['status'], { label: string; className: string }> = {
  completed: { label: 'Terminée', className: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Échouée', className: 'bg-red-100 text-red-700' },
  in_progress: { label: 'En cours', className: 'bg-(--color-primary)/10 text-(--color-primary)' },
  not_started: { label: 'Non commencée', className: 'bg-slate-100 text-slate-600' },
};

export default function FormationDetail({ formation }: FormationDetailProps) {
  const router = useRouter();
  const summaryQuery = useFormationSummaryQuery(formation.enrollmentId);

  const nodes = summaryQuery.data?.nodes ?? [];
  const modules = nodes.filter((n): n is FormationModule => n.type === 'module');
  const evaluations = nodes.filter((n): n is FormationEvaluation => n.type === 'evaluation');

  const completedModules = summaryQuery.data
    ? modules.filter((m) => m.progress === 100).length
    : formation.completedModules;
  const totalModules = summaryQuery.data ? modules.length : formation.totalModules;

  const progress = summaryQuery.data?.progress ?? formation.progress;
  const status = STATUS_BADGE[formation.status];
  const hasStarted = progress > 0;
  // États terminaux : le parcours ne se poursuit plus, il se consulte.
  const isTerminal = formation.status === 'completed' || formation.status === 'failed';

  return (
    <div className="pb-10">
      {/* ── En-tête + statistiques ─────────────────────────────────────────
          Une seule carte délimitée par un trait, sans aplat de fond : le hero et
          la bande de repères sont séparés par un simple filet horizontal, ce qui
          garde la continuité qu'apportait le bandeau sombre sans en avoir le
          poids visuel. */}
      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200">
        <section className="px-6 py-8 sm:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,340px)]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={status.className}>{status.label}</Badge>
                {formation.category && (
                  <Badge className="bg-slate-100 text-slate-600">{formation.category}</Badge>
                )}
              </div>

              {/* Titre volontairement large : sur Coursera c'est l'élément qui
                  domine l'écran, avant même l'illustration. */}
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {formation.title}
              </h1>

              {formation.description && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  {formation.description}
                </p>
              )}

              {formation.status === 'failed' && (
                <div
                  role="alert"
                  className="mt-4 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-red-800">Formation en échec</p>
                  <p className="mt-0.5 text-sm text-red-700">
                    {formation.failureReason ??
                      'Les tentatives autorisées ont été épuisées et aucune voie de secours n’était prévue.'}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  onClick={() => router.push(`/my-learning-paths/${formation.enrollmentId}/learn`)}
                  className="h-11 gap-2 bg-(--color-primary) px-6 text-sm font-semibold hover:bg-(--color-primary)/90"
                >
                  <Play className="size-4 fill-current" />
                  {isTerminal
                    ? 'Consulter la formation'
                    : hasStarted
                      ? 'Reprendre la formation'
                      : 'Commencer la formation'}
                </Button>

                {hasStarted && (
                  <span className="text-xs text-slate-500">
                    Vous avez terminé {progress}% de cette formation
                  </span>
                )}
              </div>
            </div>

            {/* Cadre de l'image en trait plutôt qu'en ombre portée : sans fond
                sombre derrière, une ombre flotterait dans le vide. */}
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="relative aspect-video">
                <img
                  src={learningPathCover(formation.coverImage)}
                  alt={formation.title}
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Bande de statistiques ────────────────────────────────────────
            Le bandeau chiffré que Coursera place juste sous son hero : des repères
            séparés par des filets verticaux, à la place des quatre encarts gris de
            poids égal dont l'un était vide. */}
        <section className="border-t border-slate-200 px-6 py-4 sm:px-8">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:items-center sm:gap-0">
            <div className="sm:pr-8">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                <Layers className="size-3.5" />
                Programme
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {totalModules} module{totalModules > 1 ? 's' : ''}
              </dd>
            </div>

            {formation.totalDurationMin > 0 && (
              <div className="sm:border-l sm:border-slate-200 sm:px-8">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="size-3.5" />
                  Durée
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                  {formatDuration(formation.totalDurationMin)}
                </dd>
              </div>
            )}

            {formation.level && (
              <div className="sm:border-l sm:border-slate-200 sm:px-8">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <GraduationCap className="size-3.5" />
                  Niveau
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">{formation.level}</dd>
              </div>
            )}

            {formation.lastActivity && (
              <div className="sm:border-l sm:border-slate-200 sm:px-8">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <History className="size-3.5" />
                  Dernière activité
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                  {formation.lastActivity}
                </dd>
              </div>
            )}

            {formation.hasCertificate && (
              <div className="sm:border-l sm:border-slate-200 sm:px-8">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Award className="size-3.5" />À la clé
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-emerald-700">Attestation</dd>
              </div>
            )}

            {/* Progression rattachée à la même bande, avec sa barre : c'est la
              donnée qui change, contrairement aux repères ci-dessus. */}
            <div className="col-span-2 sm:ml-auto sm:min-w-56 sm:border-l sm:border-slate-200 sm:pl-8">
              <dt className="flex items-center justify-between text-xs text-slate-500">
                <span>Votre progression</span>
                <span className="font-semibold tabular-nums text-slate-900">{progress}%</span>
              </dt>
              <dd className="mt-1.5">
                <ProgressVariant
                  value={progress}
                  indicatorColor={
                    formation.status === 'failed'
                      ? 'bg-red-500'
                      : formation.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-(--color-primary)'
                  }
                  className="h-1"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {completedModules} sur {totalModules} module{totalModules > 1 ? 's' : ''} terminé
                  {completedModules > 1 ? 's' : ''}
                </p>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* ── Programme ─────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Contenu de la formation
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {totalModules} module{totalModules > 1 ? 's' : ''}
            {evaluations.length > 0 &&
              ` · ${evaluations.length} évaluation${evaluations.length > 1 ? 's' : ''}`}
            {formation.totalDurationMin > 0 &&
              ` · ${formatDuration(formation.totalDurationMin)} pour terminer`}
          </p>
        </div>

        {summaryQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : summaryQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Impossible de charger le contenu de la formation.
          </div>
        ) : nodes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-muted-foreground">
            Le programme de cette formation n'est pas encore disponible.
          </div>
        ) : (
          // `type="multiple"` sur un seul Accordion : chaque module était
          // auparavant son propre Accordion racine, ce qui empêchait tout
          // comportement d'ensemble et dupliquait la structure ARIA.
          // La racine Accordion porte `border rounded-md overflow-hidden` par
          // défaut : neutralisé ici, sinon une bordure englobante se superpose à
          // celle de chaque module.
          <Accordion
            type="multiple"
            className="gap-2 rounded-none border-none bg-transparent overflow-visible"
          >
            {(() => {
              let moduleIndex = 0;

              return nodes.map((node) => {
                if (node.type === 'module') {
                  moduleIndex += 1;
                  return (
                    <CurriculumModule
                      key={node.id}
                      module={node as FormationModule}
                      index={moduleIndex}
                    />
                  );
                }

                const ev = node as FormationEvaluation;
                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                      <ClipboardCheck className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{ev.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Évaluation {ev.evaluationType === 'final' ? 'finale' : 'intermédiaire'}
                      </p>
                    </div>
                    <Badge className="shrink-0 bg-slate-100 text-slate-600">
                      Score requis {ev.passingScore}%
                    </Badge>
                  </div>
                );
              });
            })()}
          </Accordion>
        )}
      </section>
    </div>
  );
}
