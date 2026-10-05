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
  disabled?: boolean;
  className?: string;
}

export function ExamAnswerPanel({
  question,
  answer,
  onAnswer,
  onToggleMultiple,
  onMatchPair,
  className,
  saved = false,
  disabled = false,
}: ExamAnswerPanelProps) {
  return (
    <section aria-label="Vos réponses" className={className}>
      {/* Autosave indicator */}
      <div className="flex items-center justify-center">
        <div className="w-full">
          <QuestionRenderer
            question={question}
            answer={answer}
            onAnswer={onAnswer}
            onToggleMultiple={onToggleMultiple}
            onMatchPair={onMatchPair}
            disabled={disabled}
          />
          {saved && <p className="mt-3 text-xs text-muted-foreground">Réponse enregistrée</p>}
        </div>
      </div>
    </section>
  );
}
