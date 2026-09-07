'use client';

import { Check, Clock, Lock } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/shared/lib/duration';
import ContentTypeIcon from '../../formation-learning/components/sidebar/ContentTypeIcon';
import type {
  ContentType,
  CourseContent,
  FormationModule,
} from '../../formation-learning/lib/types';

interface Props {
  module: FormationModule;
  /** 1-based rank among modules only — evaluations are numbered separately. */
  index: number;
}

/** Libellés au singulier / pluriel pour le décompte du module. */
const CONTENT_TYPE_LABELS: Record<ContentType, [string, string]> = {
  'text-media': ['leçon', 'leçons'],
  page: ['page', 'pages'],
  file: ['document', 'documents'],
  folder: ['dossier', 'dossiers'],
  scorm: ['module interactif', 'modules interactifs'],
  survey: ['questionnaire', 'questionnaires'],
  url: ['lien', 'liens'],
};

function flattenContents(module: FormationModule): CourseContent[] {
  return module.courses.flatMap((course) => course.sections.flatMap((s) => s.contents));
}

/**
 * « 3 leçons · 2 documents · 1 questionnaire »
 *
 * Repris du syllabus Coursera, qui annonce la composition d'un module avant
 * qu'on l'ouvre : on sait tout de suite si c'est de la lecture, de la vidéo ou
 * de l'évaluation. Le décompte brut « 6 contenus » ne dit rien de tout ça.
 */
function describeComposition(contents: CourseContent[]): string {
  const counts = new Map<ContentType, number>();
  for (const content of contents) {
    counts.set(content.type, (counts.get(content.type) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => {
      const [singular, plural] = CONTENT_TYPE_LABELS[type] ?? ['contenu', 'contenus'];
      return `${count} ${count > 1 ? plural : singular}`;
    })
    .join(' · ');
}

/**
 * Un module du syllabus, présenté à la manière de Coursera : surtitre « Module N »,
 * durée annoncée, puis la composition du module. La version précédente listait des
 * titres de cours et rien d'autre — impossible de jauger l'effort avant d'ouvrir.
 */
export default function CurriculumModule({ module, index }: Props) {
  const contents = flattenContents(module);
  const completed = contents.filter((c) => c.completed || c.status === 'completed').length;
  const totalMinutes = contents.reduce((sum, c) => sum + (c.durationMin ?? 0), 0);

  const isLocked = module.status === 'locked';
  const isDone = module.progress === 100;

  return (
    <AccordionItem
      value={module.id}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white last:border-b"
    >
      <AccordionTrigger
        className="items-center gap-4 px-5 py-4 hover:no-underline"
        disabled={isLocked}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums',
              isLocked && 'bg-slate-100 text-slate-400',
              !isLocked && isDone && 'bg-emerald-100 text-emerald-700',
              !isLocked && !isDone && 'bg-(--color-primary)/10 text-(--color-primary)',
            )}
          >
            {isLocked ? (
              <Lock className="size-3.5" />
            ) : isDone ? (
              <Check className="size-4" strokeWidth={3} />
            ) : (
              index
            )}
          </span>

          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Module {index}
              {totalMinutes > 0 && (
                <span className="ml-2 font-normal normal-case tracking-normal text-slate-500">
                  <Clock className="mr-1 inline size-3 align-[-2px]" />
                  {formatDuration(totalMinutes)}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[15px] font-semibold text-slate-900">
              {module.title}
            </span>
            {contents.length > 0 && (
              <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
                {describeComposition(contents)}
              </span>
            )}
          </span>

          {!isLocked && (
            <span className="hidden shrink-0 items-center gap-2.5 sm:flex">
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                <span
                  className={cn(
                    'block h-full rounded-full transition-[width]',
                    isDone ? 'bg-emerald-500' : 'bg-(--color-primary)',
                  )}
                  style={{ width: `${module.progress}%` }}
                />
              </span>
              <span className="w-14 text-right text-xs font-medium tabular-nums text-slate-500">
                {completed}/{contents.length}
              </span>
            </span>
          )}
        </div>
      </AccordionTrigger>

      {/* AccordionContent applique déjà un `px-2` sur son conteneur externe :
          on s'appuie sur le contraste de fond plutôt que sur une bordure, qui
          serait décalée de ce padding et ne toucherait pas les bords. */}
      <AccordionContent className="bg-slate-50/60 px-3 py-4">
        <div className="space-y-4">
          {module.courses.map((course) => (
            <div key={course.id}>
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {course.title}
              </p>
              <ul className="space-y-0.5">
                {course.sections.flatMap((section) =>
                  section.contents.map((content) => (
                    <li
                      key={content.id}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
                    >
                      {content.completed || content.status === 'completed' ? (
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                          <Check className="size-2.5 text-white" strokeWidth={3} />
                        </span>
                      ) : content.status === 'locked' ? (
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-200">
                          <Lock className="size-2.5 text-slate-400" />
                        </span>
                      ) : (
                        <span className="size-4 shrink-0 rounded-full border-[1.5px] border-slate-300 bg-white" />
                      )}

                      <ContentTypeIcon type={content.type} />

                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          content.status === 'locked' ? 'text-slate-400' : 'text-slate-700',
                        )}
                      >
                        {content.title}
                      </span>

                      {content.durationMin != null && (
                        <span className="shrink-0 text-xs tabular-nums text-slate-400">
                          {content.durationMin} min
                        </span>
                      )}
                    </li>
                  )),
                )}
              </ul>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
