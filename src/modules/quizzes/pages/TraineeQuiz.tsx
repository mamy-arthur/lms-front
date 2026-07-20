'use client';

import { MOCK_QUESTIONS } from '@modules/shared/components/questions/mocks/questions.mock';
import { normalizeQuestion } from '@/modules/shared/lib/normalizers';
import { Quiz } from '../components/Quiz';

/**
 * TraineeQuiz
 *
 * Page de passation d'un quiz destinée aux stagiaires.
 *
 * @example
 * // Minimal usage — questions resolved from props or query param
 * <TraineeQuiz quizId="quiz-001" title="Fondamentaux React" />
 */
interface TraineeQuizProps {
  quizId?: string;
  title?: string;
  description?: string;
}

export function TraineeQuiz({
  quizId = 'quiz-001',
  title = 'Quiz',
  description,
}: TraineeQuizProps) {
  // ── Data resolution ────────────────────────────────────────────────────────
  // Currently uses mock data; replace with a real API call / server-fetched
  // prop when the backend is available.
  const questions = (MOCK_QUESTIONS as Record<string, unknown>[])
    .map(normalizeQuestion)
    .filter((q) => q.quizId === quizId && q.isActive);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <span className="truncate text-sm font-semibold text-foreground">{title}</span>
        </div>
      </header>

      {/* Content */}
      <main className="py-8">
        <Quiz questions={questions} title={title} description={description} />
      </main>
    </div>
  );
}
