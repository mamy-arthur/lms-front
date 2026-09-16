'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { UserRound, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getDemoStudentAttempts } from '../data/studentAttemptsDemo';
import {
  enrollmentStatuses,
  getDemoFormationStudents,
  type DashboardEnrollmentStatus,
  type FormationProgressDemo,
} from '../data/studentProgressDemo';
import { StudentAttemptHistory } from './StudentAttemptHistory';

export type FormationStudentSelection = {
  formation: FormationProgressDemo;
  status: DashboardEnrollmentStatus;
};

export function FormationStudentsSheet({
  selection,
  onClose,
  onRestoreFocus,
}: {
  selection: FormationStudentSelection | null;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  return (
    <Sheet
      open={selection !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <FormationStudentsContent
        key={selection ? `${selection.formation.id}-${selection.status}` : 'closed'}
        selection={selection}
        onRestoreFocus={onRestoreFocus}
      />
    </Sheet>
  );
}

function FormationStudentsContent({
  selection,
  onRestoreFocus,
}: {
  selection: FormationStudentSelection | null;
  onRestoreFocus: () => void;
}) {
  const students = selection ? getDemoFormationStudents(selection.formation, selection.status) : [];
  const [studentId, setStudentId] = useState<string | null>(() => students[0]?.id ?? null);
  const historyId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const studentButtons = useRef(new Map<string, HTMLButtonElement>());
  const previousStudentId = useRef<string | null>(null);
  const status = enrollmentStatuses.find((item) => item.key === selection?.status);
  const student = students.find((item) => item.id === studentId);
  const attempts =
    selection && student
      ? getDemoStudentAttempts(selection.formation, selection.status, student.id)
      : [];

  useEffect(() => {
    if (studentId) {
      headingRef.current?.focus();
    } else if (previousStudentId.current) {
      studentButtons.current.get(previousStudentId.current)?.focus();
    }
    previousStudentId.current = studentId;
  }, [studentId]);

  return (
    <SheetContent
      showCloseButton={false}
      data-expanded={Boolean(student)}
      className={cn(
        'data-[side=right]:w-full transition-[max-width] duration-300 motion-reduce:transition-none motion-reduce:animate-none',
        student ? 'data-[side=right]:sm:max-w-7xl' : 'data-[side=right]:sm:max-w-lg',
      )}
      onOpenAutoFocus={(event) => {
        if (headingRef.current) {
          event.preventDefault();
          headingRef.current.focus();
        }
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onRestoreFocus();
      }}
    >
      <SheetHeader className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          <SheetTitle>Étudiants · {status?.label}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Fermer le panneau">
              <X aria-hidden="true" />
            </Button>
          </SheetClose>
        </div>
        <SheetDescription>{selection?.formation.name}</SheetDescription>
      </SheetHeader>
      <div
        className={cn(
          'min-h-0 flex-1 border-t border-border',
          student && 'grid lg:grid-cols-[minmax(0,1fr)_25rem]',
        )}
      >
        {student && (
          <section
            id={historyId}
            aria-labelledby={`${historyId}-title`}
            className="min-h-0 min-w-0 overflow-y-auto p-4 sm:p-6"
          >
            <div className="mb-5 space-y-4">
              <div className="space-y-1">
                <h2
                  id={`${historyId}-title`}
                  ref={headingRef}
                  tabIndex={-1}
                  className="rounded-sm text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Tentatives de {student.name}
                </h2>
                <p className="break-all text-xs text-muted-foreground">{student.email}</p>
              </div>
            </div>
            <StudentAttemptHistory key={student.id} attempts={attempts} />
          </section>
        )}
        <div
          className={cn(
            'h-full min-h-0 min-w-0 overflow-y-auto px-4 pb-6',
            student && 'hidden lg:block lg:border-l',
          )}
        >
          <p className="px-2 py-3 text-xs text-muted-foreground">
            {students.length} étudiant{students.length > 1 ? 's' : ''} · Cliquez pour voir les
            tentatives.
          </p>
          <ul aria-label="Étudiants concernés" className="divide-y">
            {students.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  ref={(node) => {
                    if (node) studentButtons.current.set(item.id, node);
                    else studentButtons.current.delete(item.id);
                  }}
                  aria-label={`Voir les tentatives de ${item.name}`}
                  aria-pressed={item.id === studentId}
                  aria-controls={student ? historyId : undefined}
                  className="flex w-full items-center gap-3 rounded-sm px-2 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-pressed:bg-primary/5"
                  onClick={() => setStudentId(item.id)}
                >
                  <Avatar size="lg" aria-hidden="true">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <UserRound className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block truncate text-sm font-medium" title={item.name}>
                      {item.name}
                    </span>
                    <span
                      className="block truncate text-xs text-muted-foreground"
                      title={item.email}
                    >
                      {item.email}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SheetContent>
  );
}
