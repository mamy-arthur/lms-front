'use client';

import { cn } from '@/lib/utils';
import type { Question } from '../../types';

interface TrueFalseQuestionProps {
  question: Question;
  answer: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function TrueFalseQuestion({
  question,
  answer,
  onChange,
  disabled = false,
}: TrueFalseQuestionProps) {
  const options = [
    {
      value: true,
      label: 'Vrai',
      icon: '✓',
      hoverColor: 'hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
      selectedColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-md',
      indicatorColor: 'border-emerald-500 bg-emerald-500 text-white',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      value: false,
      label: 'Faux',
      icon: '✗',
      hoverColor: 'hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30',
      selectedColor: 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 shadow-md',
      indicatorColor: 'border-rose-500 bg-rose-500 text-white',
      textColor: 'text-rose-600 dark:text-rose-400',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map(
        ({ value, label, icon, hoverColor, selectedColor, indicatorColor, textColor }) => {
          const selected = answer === value;
          return (
            <button
              key={String(value)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(value)}
              className={cn(
                'group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 px-6 py-10 text-center transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected ? selectedColor : cn('border-border bg-card hover:shadow-md', hoverColor),
                disabled && 'cursor-not-allowed opacity-60',
              )}
              aria-pressed={selected}
              aria-label={`Répondre : ${label} à la question "${question.name}"`}
            >
              {/* Big icon badge */}
              <span
                className={cn(
                  'flex size-14 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold transition-all duration-200',
                  selected
                    ? indicatorColor
                    : 'border-muted-foreground/30 bg-muted text-muted-foreground',
                )}
              >
                {icon}
              </span>

              <span
                className={cn(
                  'text-lg font-semibold tracking-wide transition-colors',
                  selected ? textColor : 'text-foreground',
                )}
              >
                {label}
              </span>
            </button>
          );
        },
      )}
    </div>
  );
}
