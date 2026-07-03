'use client';

import { QUESTION_TYPE_OPTIONS } from '@modules/shared/components/questions';
import { TYPE_ICONS } from './question-form-constants';
interface QuestionFormTypeSelectProps {
  onSelect: (type: string) => void;
}

export function QuestionFormTypeSelect({ onSelect }: QuestionFormTypeSelectProps) {
  return (
    <div className="space-y-6 px-2 py-2">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="space-y-1.5">
          <h2 className="text-balance text-xl font-semibold leading-snug tracking-tight text-foreground">
            Choisir le type de question
          </h2>
          <p className="text-balance text-sm leading-relaxed text-muted-foreground">
            Sélectionnez le format qui correspond le mieux à votre besoin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {QUESTION_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className="group flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98] active:shadow-sm"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-current/10 text-xl transition-all duration-200 group-hover:scale-110 group-hover:bg-current/15 ${
                TYPE_ICONS[opt.value]?.color ?? 'text-primary'
              }`}
            >
              {TYPE_ICONS[opt.value]?.icon}
            </div>
            <span className="text-sm font-medium leading-tight text-foreground">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
