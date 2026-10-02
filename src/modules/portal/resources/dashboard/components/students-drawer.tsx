'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StudentAttemptHistory } from '@/modules/shared/components/dashboard/StudentAttemptHistory';
import { StudentContactButton } from '@/modules/shared/components/StudentContactButton';
import type { DashboardStudent } from '../types';

interface StudentDrawerProps {
  student: DashboardStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreFocus?: () => void;
}

export function StudentDrawer({ student, open, onOpenChange, onRestoreFocus }: StudentDrawerProps) {
  return (
    <Sheet open={open && student !== null} onOpenChange={onOpenChange}>
      {open && student && (
        <SheetContent
          side="right"
          className="data-[side=right]:w-full data-[side=right]:max-w-200! gap-0 p-0"
          onCloseAutoFocus={(event) => {
            if (onRestoreFocus) {
              event.preventDefault();
              onRestoreFocus();
            }
          }}
        >
          <SheetHeader className="shrink-0 border-b pr-14 text-left">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="lg" aria-hidden="true" className="shrink-0">
                  <AvatarImage src={student.avatarUrl} alt="" />
                  <AvatarFallback className="bg-(--color-primary) text-xs text-primary-foreground">
                    {student.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="text-base font-semibold">
                    <span className="sr-only">Détail de </span>
                    {student.name}
                  </SheetTitle>
                  <p className="break-all text-xs text-muted-foreground">
                    {student.email ?? 'E-mail indisponible'}
                  </p>
                </div>
              </div>
              <StudentContactButton email={student.email} />
            </div>
            <SheetDescription className="sr-only">
              {student.course} — Historique des tentatives de cette inscription.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <StudentAttemptHistory key={student.id} enrollmentId={student.id} />
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}
