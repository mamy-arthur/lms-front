'use client';

import { useMemo, useRef, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Quiz } from '@/modules/quizzes';
import { normalizeQuestion } from '@/modules/shared/lib/normalizers';
import { evaluationAttemptsApi } from '@/shared/api/portal.api';
import type { ApiAttemptQuiz, ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import type { MatchingAnswer, MultipleChoiceAnswer, TraineeAnswer } from '@/modules/quizzes/types';
import type { Question } from '@/modules/shared/lib/normalizers';
import EvaluationSplash from './EvaluationSplash';
import type { FormationEvaluation } from '../lib/types';
import { cn } from '@/lib/utils';

function makeSessionId() {
  return 'EV-' + Math.random().toString(16).slice(2, 6).toUpperCase() + '-2026';
}

// ─── API quiz → local Question ────────────────────────────────────────────────

function normalizeAttemptQuiz(q: ApiAttemptQuiz): Question {
  if (q.type === 'matching') {
    // Build pairs directly — do NOT go through normalizeQuestion to avoid double-mapping issues
    const leftValues = q.left_values ?? [];
    const rightValues = q.right_values ?? [];
    return {
      id: q.id,
      quizId: q.quiz_id,
      name: '',
      text: q.question,
      type: 'matching',
      generalFeedback: '',
      referenceNumber: '',
      isActive: true,
      duration: null,
      competencyId: '',
      correctAnswer: false,
      feedbackTrue: '',
      feedbackFalse: '',
      options: [],
      pairs: leftValues.map((left, i) => ({
        id: String(i),
        question: left,
        answer: rightValues[i] ?? '',
      })),
      updatedAt: '',
    };
  }

  return normalizeQuestion({
    id: q.id,
    quiz_id: q.quiz_id,
    type: q.type,
    text: q.question,
    options: (q.options ?? []).map((o) => ({ id: o.id, label: o.label, is_correct: false })),
    pairs: [],
    correct_answer: false,
  });
}

// ─── Local answer → API payload ───────────────────────────────────────────────

function toApiPayload(quiz: ApiAttemptQuiz, answer: TraineeAnswer): Record<string, unknown> {
  switch (quiz.type) {
    case 'single_choice':
      return { selected_option_ids: answer ? [answer as string] : [] };
    case 'multiple_choice':
      return { selected_option_ids: [...(answer as MultipleChoiceAnswer)] };
    case 'true_false':
      return { answer: answer as boolean };
    case 'matching': {
      const mapping = answer as MatchingAnswer; // leftIdx → rightIdx (both as string indices)
      const leftValues = quiz.left_values ?? [];
      const rightValues = quiz.right_values ?? [];
      return {
        pairs: Object.entries(mapping).map(([leftIdx, rightIdx]) => ({
          left: leftValues[Number(leftIdx)] ?? '',
          right: rightValues[Number(rightIdx)] ?? '',
        })),
      };
    }
    default:
      return {};
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  evaluation: FormationEvaluation;
  onComplete: (score: number, passed: boolean) => void;
}

export default function EvaluationRunner({ evaluation, onComplete }: Props) {
  // Real mode: evaluation loaded from summary (no pre-fetched questions).
  const isRealMode = evaluation.questions.length === 0;

  // ── Mock mode state ──────────────────────────────────────────────────────
  const [mockStarted, setMockStarted] = useState(false);
  const sessionIdRef = useRef(makeSessionId());

  const mockQuestions = useMemo(
    () => evaluation.questions.map(normalizeQuestion),
    [evaluation.questions],
  );
  const mockStats = useMemo(() => {
    const types = mockQuestions.reduce<Record<string, number>>((acc, q) => {
      acc[q.type] = (acc[q.type] ?? 0) + 1;
      return acc;
    }, {});
    return { types, hasDuration: mockQuestions.filter((q) => q.duration !== null).length };
  }, [mockQuestions]);

  // ── Real mode state ──────────────────────────────────────────────────────
  const [attempt, setAttempt] = useState<ApiEvaluationAttempt | null>(null);
  const [phase, setPhase] = useState<'splash' | 'quiz' | 'result'>('splash');
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const apiQuestions = useMemo<Question[]>(
    () => (attempt ? attempt.quizzes.map(normalizeAttemptQuiz) : []),
    [attempt],
  );

  async function handleRealStart() {
    setIsStarting(true);
    try {
      // evaluation.formationId is set to the learning path id in summary-mapper
      const res = await evaluationAttemptsApi.start(evaluation.formationId, evaluation.id);
      setAttempt(res.data);
      setPhase('quiz');
    } catch {
      toast.error("Impossible de démarrer l'évaluation. Réessayez.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleRealSubmit(_: unknown, answers: Record<string, TraineeAnswer>) {
    if (!attempt) return;
    setIsSubmitting(true);
    try {
      // Send each answer individually
      for (const [attemptQuizId, answer] of Object.entries(answers)) {
        const quiz = attempt.quizzes.find((q) => q.id === attemptQuizId);
        if (!quiz || answer === null || answer === undefined) continue;
        await evaluationAttemptsApi.answer(attempt.id, attemptQuizId, toApiPayload(quiz, answer));
      }
      // Finalize
      const res = await evaluationAttemptsApi.submit(attempt.id);
      const score = res.data.score ?? 0;
      setFinalScore(score);
      setPhase('result');
      onComplete(score, score >= evaluation.passingScore);
    } catch {
      toast.error('Erreur lors de la soumission. Vos réponses ont été sauvegardées.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Mock mode render ─────────────────────────────────────────────────────

  if (!isRealMode) {
    if (mockStarted) {
      const typLabel = evaluation.evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';
      return (
        <Quiz
          key="quiz-session"
          questions={mockQuestions}
          title={evaluation.title}
          description={`Évaluation ${typLabel} · Score requis : ${evaluation.passingScore}%`}
          sessionId={sessionIdRef.current}
          onReset={() => setMockStarted(false)}
        />
      );
    }
    return (
      <EvaluationSplash
        title={evaluation.title}
        evaluationType={evaluation.evaluationType}
        passingScore={evaluation.passingScore}
        questionCount={mockQuestions.length}
        withTimerCount={mockStats.hasDuration}
        typeCount={Object.keys(mockStats.types).length}
        onStart={() => setMockStarted(true)}
      />
    );
  }

  // ── Real mode render ─────────────────────────────────────────────────────

  if (phase === 'result') {
    const score = finalScore ?? 0;
    const passed = score >= evaluation.passingScore;

    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-12">
        {/* Result icon */}
        <div
          className={cn(
            'mb-6 flex size-20 items-center justify-center rounded-full',
            passed ? 'bg-emerald-500/10' : 'bg-red-500/10',
          )}
        >
          {passed ? (
            <CheckCircle className="size-10 text-emerald-500" />
          ) : (
            <XCircle className="size-10 text-red-500" />
          )}
        </div>

        {/* Heading */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Résultat de l'évaluation
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {passed ? 'Félicitations ! 🎉' : 'Évaluation terminée'}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {passed
              ? 'Vous avez atteint le score requis pour réussir cette évaluation.'
              : 'Vous n’avez pas atteint le score requis cette fois-ci.'}
          </p>
        </div>

        {/* Score card */}
        <div className="mt-8 w-full rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-muted-foreground">Votre score</span>

            <div
              className={cn(
                'mt-2 text-6xl font-bold tracking-tight',
                passed ? 'text-emerald-500' : 'text-red-500',
              )}
            >
              {score}%
            </div>

            {/* Progress */}
            <div className="mt-5 w-full max-w-sm">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Votre score</span>
                <span>Score requis : {evaluation.passingScore}%</span>
              </div>

              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    passed ? 'bg-emerald-500' : 'bg-red-500',
                  )}
                  style={{ width: `${Math.min(score, 100)}%` }}
                />

                {/* Passing score marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/50"
                  style={{
                    left: `${evaluation.passingScore}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status message */}
        <div
          className={cn(
            'mt-4 w-full rounded-xl border p-4',
            passed
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
              : 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20',
          )}
        >
          <div className="flex gap-3">
            {passed ? (
              <CheckCircle className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
            )}

            <div>
              <p
                className={cn(
                  'text-sm font-semibold',
                  passed
                    ? 'text-emerald-900 dark:text-emerald-200'
                    : 'text-red-900 dark:text-red-200',
                )}
              >
                {passed ? 'Évaluation réussie' : 'Score insuffisant'}
              </p>

              <p
                className={cn(
                  'mt-1 text-sm',
                  passed
                    ? 'text-emerald-800/80 dark:text-emerald-300/80'
                    : 'text-red-800/80 dark:text-red-300/80',
                )}
              >
                {passed
                  ? `Votre score de ${score}% est supérieur au minimum requis de ${evaluation.passingScore}%.`
                  : `Un score de ${evaluation.passingScore}% était nécessaire pour réussir.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && attempt) {
    if (isSubmitting) {
      return (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Envoi de vos réponses…</p>
        </div>
      );
    }
    const typLabel = evaluation.evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';
    return (
      <Quiz
        key={attempt.id}
        questions={apiQuestions}
        title={evaluation.title}
        description={`Évaluation ${typLabel} · Score requis : ${evaluation.passingScore}%`}
        sessionId={attempt.id}
        onSubmit={handleRealSubmit}
      />
    );
  }

  // splash
  return (
    <EvaluationSplash
      title={evaluation.title}
      evaluationType={evaluation.evaluationType}
      passingScore={evaluation.passingScore}
      questionCount={attempt?.quizzes.length ?? evaluation.questions.length}
      withTimerCount={0}
      typeCount={0}
      onStart={handleRealStart}
      isLoading={isStarting}
    />
  );
}
