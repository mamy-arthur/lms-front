'use client';

import type { Question } from '../../types';

const TYPE_INSTRUCTIONS: Record<string, string> = {
  true_false: "Indiquez si l'affirmation est vraie ou fausse",
  single_choice: 'Sélectionnez une seule réponse',
  multiple_choice: 'Sélectionnez toutes les réponses correctes',
  matching: 'Associez chaque élément de gauche à son correspondant',
};

interface ExamQuestionPanelProps {
  question: Question;
}

export function ExamQuestionPanel({ question }: ExamQuestionPanelProps) {
  const instruction = TYPE_INSTRUCTIONS[question.type] ?? 'Répondez à la question ci-dessus';

  return (
    <header className="flex flex-col items-center gap-1 text-center">
      {/* Optional subtitle */}
      {question.name && (
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {question.name}
        </p>
      )}

      {/* Question text */}
      <p
        className="text-[26px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground"
        style={{ wordBreak: 'break-word' }}
      >
        {question.text}
      </p>

      {/* Instruction · points */}
      <p className="text-sm text-zinc-400 dark:text-zinc-500">{instruction}</p>

      {/*
        ── Extension slot ────────────────────────────────────────────────────
        {question.codeSnippet && <CodeBlock code={question.codeSnippet} />}
        {question.imageUrl && <img src={question.imageUrl} alt="" />}
      */}
    </header>
  );
}
