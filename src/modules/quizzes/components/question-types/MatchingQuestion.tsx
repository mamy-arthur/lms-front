'use client';

import { Fragment, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Question } from '../../types';
import type { MatchingAnswer } from '../../types';

interface MatchingQuestionProps {
  question: Question;
  answer: MatchingAnswer;
  onPairChange: (leftId: string, rightId: string) => void;
  disabled?: boolean;
}

export function MatchingQuestion({
  question,
  answer,
  onPairChange,
  disabled = false,
}: MatchingQuestionProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  // Shuffle right side once (stable across renders using useMemo)
  const shuffledRight = useMemo(() => {
    const right = question.pairs.map((p) => ({ id: p.id, answer: p.answer }));
    for (let i = right.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [right[i], right[j]] = [right[j], right[i]];
    }
    return right;
  }, [question.id]);

  const handleLeftClick = (id: string) => {
    if (disabled) return;
    setSelectedLeft((prev) => (prev === id ? null : id));
  };

  const handleRightClick = (rightId: string) => {
    if (disabled || !selectedLeft) return;
    onPairChange(selectedLeft, rightId);
    setSelectedLeft(null);
  };

  // Reverse map: rightId → leftId (for highlighting)
  const rightToLeft = useMemo(
    () =>
      Object.entries(answer).reduce<Record<string, string>>((acc, [l, r]) => {
        acc[r] = l;
        return acc;
      }, {}),
    [answer],
  );

  const matchColor = (leftId: string): string => {
    const keys = Object.keys(answer);
    const idx = keys.indexOf(leftId);
    if (idx === -1) return '';
    const hues = [210, 155, 34, 280, 16, 190];
    return `hsl(${hues[idx % hues.length]} 70% 55%)`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_44px_1fr] gap-y-2">
        {question.pairs.map((pair, i) => {
          const rightItem = shuffledRight[i];
          const matchedLeftId = rightToLeft[rightItem?.id ?? ''];

          // Left state
          const isLeftSelected = selectedLeft === pair.id;
          const isLeftMatched = pair.id in answer;
          const leftColor = isLeftMatched ? matchColor(pair.id) : undefined;

          // Right state
          const isRightMatched = !!matchedLeftId;
          const rightColor = isRightMatched ? matchColor(matchedLeftId) : undefined;
          const isTargetable = !!selectedLeft && !isRightMatched;

          return (
            <Fragment key={pair.id}>
              {/* Left cell */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleLeftClick(pair.id)}
                className={cn(
                  'rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isLeftSelected
                    ? 'border-(--color-primary) bg-primary/10 shadow-md'
                    : isLeftMatched
                      ? 'border-2 bg-card'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-(--color-primary)/4',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
                style={
                  isLeftMatched && leftColor
                    ? { borderColor: leftColor, backgroundColor: `${leftColor}14` }
                    : undefined
                }
              >
                {pair.question}
              </button>

              {/* Connector — arrow when matched, faint dot otherwise */}
              <div className="flex items-center justify-center"></div>

              {/* Right cell */}
              {rightItem && (
                <button
                  type="button"
                  disabled={disabled || (!selectedLeft && !isRightMatched)}
                  onClick={() => handleRightClick(rightItem.id)}
                  className={cn(
                    'rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isRightMatched
                      ? 'border-2 bg-card'
                      : isTargetable
                        ? 'border-primary/50 bg-(--color-primary)/6 hover:border-(--color-primary) hover:shadow-md'
                        : 'border-border bg-card opacity-70',
                    disabled && 'cursor-not-allowed opacity-60',
                  )}
                  style={
                    isRightMatched && rightColor
                      ? { borderColor: rightColor, backgroundColor: `${rightColor}14` }
                      : undefined
                  }
                >
                  {rightItem.answer}
                </button>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Reset pairs button */}
      {Object.keys(answer).length > 0 && !disabled && (
        <button
          type="button"
          onClick={() => {
            // Reset is handled at parent level by passing empty MatchingAnswer
            question.pairs.forEach((p) => onPairChange(p.id, ''));
          }}
          className="mt-1 self-start text-xs text-muted-foreground underline-offset-2 hover:text-(--color-primary) hover:underline"
        >
          Réinitialiser les paires
        </button>
      )}
    </div>
  );
}
