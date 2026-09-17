'use client';

import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/shared/lib/date';
import { usePurchasedLearningPathEnrollmentsHistoryQuery } from '../../hooks/usePurchasedLearningPathEnrollmentsHistoryQuery';
import type { PurchasedLearningPathStatKey } from '../../types';

const STAT_LABELS: Record<PurchasedLearningPathStatKey, string> = {
  cumulative: 'Inscrits cumulés',
  inProgress: 'En cours',
  notStarted: 'Non commencés',
  failed: 'Échouées',
};

interface PurchasedLearningPathStatsUsersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchasedLearningPathId: string | null;
  purchasedLearningPathName: string;
  stat: PurchasedLearningPathStatKey;
}

export function PurchasedLearningPathStatsUsersDrawer({
  open,
  onOpenChange,
  purchasedLearningPathId,
  purchasedLearningPathName,
  stat,
}: PurchasedLearningPathStatsUsersDrawerProps) {
  const { enrollments, isLoading, isFetching, total } =
    usePurchasedLearningPathEnrollmentsHistoryQuery(open ? purchasedLearningPathId : null, stat);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 max-w-225!" showCloseButton={true}>
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            {purchasedLearningPathName} — {STAT_LABELS[stat]}
            {isFetching && !isLoading && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </SheetTitle>
          <SheetDescription>
            Liste des stagiaires correspondant au filtre sélectionné ({enrollments.length}).
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-4 py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Nom complet</TableHead>
                      <TableHead>Date d'inscription</TableHead>
                      <TableHead>Date de début</TableHead>
                      <TableHead>Date de fin</TableHead>
                      <TableHead>Motif d'échec</TableHead>
                      <TableHead>Date d'échec</TableHead>
                      <TableHead>Date d'expiration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          Aucun stagiaire pour ce filtre.
                        </TableCell>
                      </TableRow>
                    ) : (
                      enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">{enrollment.fullName}</TableCell>
                          <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                          <TableCell>
                            {enrollment.startedAt ? formatDate(enrollment.startedAt) : '—'}
                          </TableCell>
                          <TableCell>
                            {enrollment.completedAt ? formatDate(enrollment.completedAt) : '—'}
                          </TableCell>
                          <TableCell>{enrollment.failureReason ?? '—'}</TableCell>
                          <TableCell>
                            {enrollment.failedAt ? formatDate(enrollment.failedAt) : '—'}
                          </TableCell>
                          <TableCell>
                            {enrollment.expiresAt ? formatDate(enrollment.expiresAt) : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {total > enrollments.length && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {enrollments.length} résultats affichés sur {total}.
                </p>
              )}
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
