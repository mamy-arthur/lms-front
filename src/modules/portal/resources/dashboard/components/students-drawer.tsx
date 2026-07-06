import { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Layers,
  CheckCircle2,
  PlayCircle,
  ListChecks,
  MessageSquare,
  Mail,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Student } from '../lib/students-data';
import { ModuleSteps } from './ModuleSteps';
import { Button } from '@/components/ui/button';
import { DeadlineBadge } from './DeadlineBadge';
import { SendEmailDialog } from './SendEmailDialog';

interface StudentDrawerProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// function SectionTitle({ children }: { children: React.ReactNode }) {
//   return (
//     <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//       {children}
//     </h3>
//   );
// }

export function StudentDrawer({ student, open, onOpenChange }: StudentDrawerProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  if (!student) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-xl" />
      </Sheet>
    );
  }

  const completed = student.modules.filter((m) => m.status === 'completed').length;
  const inProgress = student.modules.filter((m) => m.status === 'in_progress').length;
  const remaining = student.modules.filter((m) => m.status === 'not_started').length;

  const summary = [
    { icon: CheckCircle2, label: 'Module Terminés', value: completed },
    { icon: PlayCircle, label: 'Module En cours', value: inProgress },
    { icon: ListChecks, label: 'Module Restants', value: remaining },
    { icon: Layers, label: 'Global', value: `${student.progress}%` },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full data-[side=right]:max-w-200! flex-col gap-0 border-l p-0 overflow-auto"
        >
          <SheetHeader className="space-y-0 text-left">
            <SheetTitle className="sr-only">Détail de {student.name}</SheetTitle>
            <SheetDescription className="sr-only">
              Suivi de progression et activité récente
            </SheetDescription>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={student.avatarUrl} alt="" />
                  <AvatarFallback className="bg-muted text-sm font-medium">
                    {student.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{student.name}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Stagiaire</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Envoyer un message
                </Button>
                <Button
                  className="bg-(--color-primary) hover:bg-(--color-primary)/80"
                  onClick={() => setEmailDialogOpen(true)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer un e-mail
                </Button>
              </div>
            </div>
          </SheetHeader>
          <Separator />
          <div className="space-y-5 px-6 pb-10 pt-5">
            <p className="text-base font-semibold text-gray-900">{student.course}</p>
            <section className="space-y-3">
           <div className="flex justify-between gap-4 bg-gray-100/50 p-2 rounded-lg font-semibold">
                <div className="flex items-center gap-1 text-xs">
                  <CalendarDays className="h-3 w-4" aria-hidden />
                  <span className="text-xs">Début · {student.startDate}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-4" aria-hidden />
                  <span className="text-xs">Écoulé · {student.elapsed}</span>
                </div>
                {student.deadline && (
                  <div className="flex items-center gap-1 text-xs">
                    <CalendarDays className="h-3 w-4" aria-hidden />
                    <span className="text-xs">
                      Échéance ·{' '}
                      {new Date(student.deadline + 'T00:00:00').toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <DeadlineBadge deadline={student.deadline} progress={student.progress} />
                  </div>
                )}
              </div>
            </section>
            {/* Résumé */}
            <section className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {summary.map(({ icon: Icon, label, value }) => (
                  <Card key={label} className="rounded-xl border-border/60 shadow-none">
                    <CardContent className="space-y-1.5">
                      <div className="flex justify-between">
                        <p className="text-xs text-muted-foreground">{label}</p>{' '}
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      </div>

                      <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            {/* Parcours */}
            <section className="flex flex-col space-y-4">
              <span className="text-sm text-gray-500">Modules a faire</span>
              <div className="space-y-3">
                <ModuleSteps student={student} />
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
      <SendEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        recipientName={student.name}
        onSend={(subject, body) => {
          // TODO: brancher sur l’API d’envoi réelle
          console.log('Email envoyé :', { to: student.name, subject, body });
        }}
      />
    </>
  );
}
