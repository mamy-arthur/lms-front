'use client';

import { cn } from '@/lib/utils';
import type { Question } from '../../types';
import type { MultipleChoiceAnswer } from '../../types';

interface MultipleChoiceQuestionProps {
  question: Question;
  answer: MultipleChoiceAnswer;
  onChange: (optionId: string) => void;
  disabled?: boolean;
}

export function MultipleChoiceQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  return (
    <div className="flex flex-col gap-3" role="group" aria-label={question.name}>
      {question.options.map((option, index) => {
        const selected = answer.has(option.id);
        const label = String.fromCharCode(65 + index); // A, B, C…

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            role="checkbox"
            aria-checked={selected}
            className={cn(
              'group flex items-center gap-4 rounded-sm border px-5 py-4 text-left transition-all duration-200',
              'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-(--color-primary) bg-(--color-primary)/8 shadow-sm'
                : 'border-border bg-card hover:border-(--color-primary)/40 hover:bg-(--color-primary)/4',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {/* Checkbox indicator */}
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                selected
                  ? 'border-(--color-primary) bg-(--color-primary) text-white'
                  : 'border-muted-foreground/30 bg-muted text-muted-foreground group-hover:border-(--color-primary)/50',
              )}
            >
              {selected ? (
                <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 8l3.5 3.5 6.5-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                label
              )}
            </span>

            <span
              className={cn(
                'flex-1 text-sm font-medium transition-colors',
                selected ? 'text-(--color-primary)' : 'text-foreground',
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
