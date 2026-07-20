'use client';

import { useMemo, useRef, useState } from 'react';
import { BookOpenCheck, Clock, ListChecks, PlayCircle, CircleHelp } from 'lucide-react';
import { Quiz } from '@/modules/quizzes';
import { MOCK_QUESTIONS } from '@modules/shared/components/questions/mocks/questions.mock';
import { normalizeQuestion } from '@/modules/shared/lib/normalizers';
import { Button } from '@/components/ui/button';

const QUIZ_TITLE = 'Quiz de démonstration';
const QUIZ_DESCRIPTION =
  'Évaluez vos connaissances sur React, TypeScript, Node.js et plus encore. \
Répondez à chaque question et obtenez votre score à la fin.';

function makeSessionId() {
  return 'EX-' + Math.random().toString(16).slice(2, 6).toUpperCase() + '-2026';
}

export default function FormationQuizPage() {
  const [started, setStarted] = useState(false);
  const sessionIdRef = useRef(makeSessionId());

  const questions = useMemo(
    () =>
      (MOCK_QUESTIONS as Record<string, unknown>[])
        .map(normalizeQuestion)
        .filter((q) => q.isActive),
    [],
  );

  const stats = useMemo(() => {
    const types = questions.reduce<Record<string, number>>((acc, q) => {
      acc[q.type] = (acc[q.type] ?? 0) + 1;
      return acc;
    }, {});
    const hasDuration = questions.filter((q) => q.duration !== null).length;
    return { types, hasDuration };
  }, [questions]);

  if (started) {
    return (
      <Quiz
        key="quiz-session"
        questions={questions}
        title={QUIZ_TITLE}
        description={QUIZ_DESCRIPTION}
        sessionId={sessionIdRef.current}
        onReset={() => setStarted(false)}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/8">
        <BookOpenCheck className="size-10 text-primary" />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{QUIZ_TITLE}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">{QUIZ_DESCRIPTION}</p>
      </div>

      <div className="w-full rounded-2xl border border-border bg-card p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-4 py-4">
            <ListChecks className="size-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{questions.length}</span>
            <span className="text-xs text-muted-foreground">questions</span>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-4 py-4">
            <Clock className="size-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{stats.hasDuration}</span>
            <span className="text-xs text-muted-foreground">avec minuterie</span>
          </div>

          <div className="col-span-2 flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-4 py-4 sm:col-span-1">
            <CircleHelp className="size-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              {Object.keys(stats.types).length}
            </span>
            <span className="text-xs text-muted-foreground">types de questions</span>
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={() => setStarted(true)}
        className="gap-2 bg-(--color-primary) px-10 text-primary-foreground hover:bg-(--color-primary)/85"
      >
        <PlayCircle className="size-5" />
        Commencer le quiz
      </Button>
    </div>
  );
}
