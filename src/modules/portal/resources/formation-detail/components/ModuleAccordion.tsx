'use client';

import { useState } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  Circle,
  Lock,
  Video,
  FileText,
  Dumbbell,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormationModule, Lesson, LessonType, LessonStatus } from '../lib/types';

const LESSON_TYPE_CONFIG: Record<LessonType, { icon: React.ReactNode; label: string }> = {
  video: { icon: <Video className="h-3.5 w-3.5" />, label: 'Vidéo' },
  quiz: { icon: <HelpCircle className="h-3.5 w-3.5" />, label: 'Quiz' },
  exercise: { icon: <Dumbbell className="h-3.5 w-3.5" />, label: 'Exercice' },
  pdf: { icon: <FileText className="h-3.5 w-3.5" />, label: 'PDF' },
  text: { icon: <FileText className="h-3.5 w-3.5" />, label: 'Texte' },
};

function LessonStatusIcon({ status }: { status: LessonStatus }) {
  if (status === 'completed')
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />;
  if (status === 'locked') return <Lock className="h-4 w-4 shrink-0 text-slate-300" />;
  return <Circle className="h-5 w-5 shrink-0 text-slate-300" />;
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const typeConfig = LESSON_TYPE_CONFIG[lesson.type];
  const isLocked = lesson.status === 'locked';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-1 transition-colors',
        isLocked ? 'opacity-60' : 'hover:bg-slate-50',
      )}
    >
      <LessonStatusIcon status={lesson.status} />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs text-slate-700',
            lesson.status === 'completed' && 'text-slate-500',
          )}
        >
          <span className="font-medium text-slate-400 mr-2">{lesson.number}</span>
          {lesson.title}
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 shrink-0">
        {typeConfig.icon}
        <span>{typeConfig.label}</span>
        {lesson.type === 'quiz' && lesson.questions ? (
          <span>• {lesson.questions} questions</span>
        ) : (
          <span>• {lesson.durationMin} min</span>
        )}
      </div>

      {lesson.score != null && (
        <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-600 border border-green-200">
          {lesson.score}%
        </span>
      )}

      <div className="shrink-0">
        {isLocked ? null : lesson.status === 'completed' ? (
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Revoir
          </button>
        ) : (
          <button
            type="button"
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Commencer
          </button>
        )}
      </div>
    </div>
  );
}

export function ModuleAccordion({ module }: { module: FormationModule }) {
  const [open, setOpen] = useState(module.status === 'in_progress');

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        {module.status === 'completed' ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
        ) : module.status === 'in_progress' ? (
          <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[var(--color-primary)]" />
        ) : (
          <div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-200" />
        )}

        <span className="flex-1 text-sm font-semibold text-slate-800">
          Module {module.number} · {module.title}
        </span>

        <span className="shrink-0 text-xs text-slate-400">
          {module.completedLessons} / {module.totalLessons} complétés
        </span>

        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="border-t border-slate-50 px-2 py-2 space-y-0.5">
          {module.lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
