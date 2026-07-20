'use client';

import type { Question } from '../types';
import type { MatchingAnswer, MultipleChoiceAnswer, TraineeAnswer } from '../types';
import { MatchingQuestion } from './question-types/MatchingQuestion';
import { MultipleChoiceQuestion } from './question-types/MultipleChoiceQuestion';
import { SingleChoiceQuestion } from './question-types/SingleChoiceQuestion';
import { TrueFalseQuestion } from './question-types/TrueFalseQuestion';

interface QuestionRendererProps {
  question: Question;
  answer: TraineeAnswer;
  onAnswer: (answer: TraineeAnswer) => void;
  onToggleMultiple: (optionId: string) => void;
  onMatchPair: (leftId: string, rightId: string) => void;
  disabled?: boolean;
}

export function QuestionRenderer({
  question,
  answer,
  onAnswer,
  onToggleMultiple,
  onMatchPair,
  disabled = false,
}: QuestionRendererProps) {
  switch (question.type) {
    case 'true_false':
      return (
        <TrueFalseQuestion
          question={question}
          answer={answer as boolean | null}
          onChange={(v) => onAnswer(v)}
          disabled={disabled}
        />
      );

    case 'single_choice':
      return (
        <SingleChoiceQuestion
          question={question}
          answer={answer as string | null}
          onChange={(id) => onAnswer(id)}
          disabled={disabled}
        />
      );

    case 'multiple_choice':
      return (
        <MultipleChoiceQuestion
          question={question}
          answer={(answer as MultipleChoiceAnswer | undefined) ?? new Set()}
          onChange={onToggleMultiple}
          disabled={disabled}
        />
      );

    case 'matching':
      return (
        <MatchingQuestion
          question={question}
          answer={(answer as MatchingAnswer | undefined) ?? {}}
          onPairChange={onMatchPair}
          disabled={disabled}
        />
      );

    default: {
      // Exhaustiveness guard — renders nothing for unknown types
      const _exhaustive: never = question.type;
      void _exhaustive;
      return (
        <p className="text-sm text-muted-foreground">
          Type de question non pris en charge : {String(question.type)}
        </p>
      );
    }
  }
}
