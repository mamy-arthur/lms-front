'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/shared/lib/date';
import type { FormationEnrollment, FormationStatKey } from '../../types';

const STAT_LABELS: Record<FormationStatKey, string> = {
  cumulative: 'Inscrits cumulés',
  month: 'Inscrits du mois',
  inProgress: 'Inscrits en cours',
  notStarted: 'Inscrits non commencés',
};

interface FormationStatsUsersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formationName: string;
  stat: FormationStatKey;
  users: FormationEnrollment[];
}

export function FormationStatsUsersDrawer({
  open,
  onOpenChange,
  formationName,
  stat,
  users,
}: FormationStatsUsersDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 max-w-225!" showCloseButton={true}>
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>
            {formationName} - {STAT_LABELS[stat]}
          </SheetTitle>
          <SheetDescription>
            Liste des utilisateurs correspondant au filtre selectionne ({users.length}).
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-4 py-4">
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Date de debut</TableHead>
                  <TableHead>Date de fin</TableHead>
                  <TableHead>Duree theorique</TableHead>
                  <TableHead>Duree reelle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Aucun utilisateur pour ce filtre.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{formatDate(user.enrolledAt)}</TableCell>
                      <TableCell>{user.groupName ?? '—'}</TableCell>
                      <TableCell>{formatDate(user.startedAt ?? '')}</TableCell>
                      <TableCell>{formatDate(user.completedAt ?? '')}</TableCell>
                      <TableCell>{user.plannedDurationDays} jours</TableCell>
                      <TableCell>
                        {user.actualDurationDays !== null ? `${user.actualDurationDays} jours` : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
