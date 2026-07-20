'use client';

import type { Question, TraineeAnswer } from '../../types';
import { QuestionRenderer } from '../QuestionRenderer';

interface ExamAnswerPanelProps {
  question: Question;
  answer: TraineeAnswer;
  onAnswer: (answer: TraineeAnswer) => void;
  onToggleMultiple: (optionId: string) => void;
  onMatchPair: (leftId: string, rightId: string) => void;
  saved?: boolean;
  className?: string;
}

export function ExamAnswerPanel({
  question,
  answer,
  onAnswer,
  onToggleMultiple,
  onMatchPair,
  saved = false,
  className,
}: ExamAnswerPanelProps) {
  return (
    <section aria-label="Vos réponses" className={className}>
      {/* Autosave indicator */}
      <div className="mb-3 flex h-4 justify-end">
        {saved && (
          <span className="animate-in fade-in text-xs text-muted-foreground">✓ Enregistré</span>
        )}
      </div>
      <div className="flex items-center justify-center">
        <div className="w-full">
          <QuestionRenderer
            question={question}
            answer={answer}
            onAnswer={onAnswer}
            onToggleMultiple={onToggleMultiple}
            onMatchPair={onMatchPair}
          />
        </div>
      </div>
    </section>
  );
}
