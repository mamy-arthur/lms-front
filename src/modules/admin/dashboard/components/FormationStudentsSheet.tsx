import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  enrollmentStatuses,
  getDemoFormationStudents,
  type DashboardEnrollmentStatus,
  type FormationProgressDemo,
} from '../data/studentProgressDemo';

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
  const status = enrollmentStatuses.find((item) => item.key === selection?.status);
  const students = selection ? getDemoFormationStudents(selection.formation, selection.status) : [];

  return (
    <Sheet
      open={selection !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="data-[side=right]:w-full"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <SheetHeader>
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>Étudiants · {status?.label}</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost">Fermer</Button>
            </SheetClose>
          </div>
          <SheetDescription>{selection?.formation.name}</SheetDescription>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-4" aria-hidden="true" />
            {students.length} étudiant{students.length > 1 ? 's' : ''}
          </p>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <ul aria-label="Étudiants concernés" className="divide-y">
            {students.map((student) => (
              <li key={student.id} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm font-medium">{student.name}</span>
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${status?.color}`} aria-hidden="true" />
                  {status?.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
