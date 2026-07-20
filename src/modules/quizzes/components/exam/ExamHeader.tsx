'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamHeaderProps {
  title: string;
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  elapsedFormatted: string;
  /** Candidate display name — used for avatar initial */
  candidateName?: string;
  /** Short session identifier shown below the title */
  sessionId?: string;
  className?: string;
}

export function ExamHeader({
  title,
  currentIndex,
  totalQuestions,
  answeredCount,
  elapsedFormatted,
  candidateName = 'Candidat',
  sessionId,
  className,
}: ExamHeaderProps) {
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const initial = (candidateName ?? 'C').charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        'sticky top-0 z-10 shrink-0 border-b border-[0.5px] border-border bg-background',
        className,
      )}
    >
      {/* ── Main row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-[14px]">
        {/* ── Left — session identity ───────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Badge icon */}
          <div className="flex size-[26px] shrink-0 items-center justify-center rounded-[6px] bg-foreground">
            <ShieldCheck className="size-[14px] text-background" strokeWidth={2} />
          </div>
          {/* Text */}
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-[500] text-foreground">{title}</span>
            {sessionId && (
              <span className="mt-0.5 text-[11px] text-muted-foreground">Session {sessionId}</span>
            )}
          </div>
        </div>

        {/* ── Right — exam status ───────────────────────────────────────── */}
        <div className="flex items-center divide-x divide-border">
          {/* Question position */}
          <div className="flex items-center px-5">
            <span className="text-[12px] text-muted-foreground">
              Question <span className="font-[500] text-foreground">{currentIndex + 1}</span> sur{' '}
              <span className="font-[500] text-foreground">{totalQuestions}</span>
            </span>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center gap-0.5 px-5">
            <span className="text-[11px] leading-none text-muted-foreground">Temps écoulé</span>
            <span className="font-mono text-[14px] font-[500] leading-none tabular-nums text-foreground">
              {elapsedFormatted}
            </span>
          </div>

          {/* Candidate avatar */}
          <div className="flex items-center pl-5">
            <div
              className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-[500] text-muted-foreground"
              aria-label={candidateName}
            >
              {initial}
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full rounded-r-full bg-foreground/20 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
        />
      </div>
    </div>
  );
}
