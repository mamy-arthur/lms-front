'use client';

import { QUESTION_TYPE_OPTIONS } from '@modules/shared/components/questions';
import { TYPE_ICONS } from './question-form-constants';
interface QuestionFormTypeSelectProps {
  onSelect: (type: string) => void;
}

export function QuestionFormTypeSelect({ onSelect }: QuestionFormTypeSelectProps) {
  return (
    <div className="space-y-6 py-2">
      <div className="grid grid-cols-2 gap-3">
        {QUESTION_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className="group flex min-h-30 flex-col items-center justify-center gap-3 rounded-sm border border-border/60 bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98] active:shadow-sm"
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-2xl bg-current/10 text-xl transition-all duration-200 group-hover:bg-current/15 ${
                TYPE_ICONS[opt.value]?.color ?? 'text-primary'
              }`}
            >
              {TYPE_ICONS[opt.value]?.icon}
            </div>
            <span className="text-xs font-medium  text-foreground">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
