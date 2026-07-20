import { cn } from '@/lib/utils';
import type { DataTableColumn } from '@/shared/components/ui/DataTable';
import { ScoreChip } from './ScoreChip';
import {
  computeScoreSummary,
  type EvaluationNote,
  type ScoreSummary,
} from '@/modules/shared/lib/evaluation-notes';

export interface EvaluationRow {
  id: string;
  traineeName: string;
  clientName: string;
  evaluationsById: Record<string, ScoreSummary>;
}

export function buildEvaluationColumns<
  TRow extends { evaluationsById: Record<string, ScoreSummary> },
>(evaluations: { id: string; label: string }[]): DataTableColumn<TRow>[] {
  return evaluations.map<DataTableColumn<TRow>>((evaluation) => ({
    key: `evaluation_${evaluation.id}`,
    label: evaluation.label,
    headerClassName: 'max-w-[160px] truncate',
    render: (row) => {
      const summary = row.evaluationsById[evaluation.id];
      if (!summary) return <span className="text-xs text-muted-foreground">—</span>;
      return <ScoreChip pointsEarned={summary.pointsEarned} pointsMax={summary.pointsMax} />;
    },
  }));
}

export function buildRows(records: EvaluationNote[]): EvaluationRow[] {
  return records.map((row) => {
    const evaluationsById = row.evaluations.reduce<Record<string, ScoreSummary>>(
      (accumulator, evaluation) => {
        accumulator[evaluation.id] = computeScoreSummary(
          evaluation.pointsEarned,
          evaluation.pointsMax,
        );
        return accumulator;
      },
      {},
    );

    return {
      id: row.id,
      traineeName: row.traineeName,
      clientName: row.clientName,
      evaluationsById,
    };
  });
}

export function computeSuccessRate(records: EvaluationNote[]): number {
  if (records.length === 0) return 0;
  let successCount = 0;
  for (const note of records) {
    const earned = note.evaluations.reduce((s, e) => s + e.pointsEarned, 0);
    const max = note.evaluations.reduce((s, e) => s + e.pointsMax, 0);
    if (computeScoreSummary(earned, max).isSuccess) successCount++;
  }
  return Math.round((successCount / records.length) * 100);
}

export function buildDrawerColumns(
  evaluations: { id: string; label: string }[],
  showClientColumn = false,
): DataTableColumn<EvaluationRow>[] {
  const columns: DataTableColumn<EvaluationRow>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      headerClassName: 'w-[40px]',
      render: (row) => <span className="block w-[40px] text-xs font-medium">{row.id}</span>,
    },
    {
      key: 'traineeName',
      label: 'Stagiaire',
      sortable: true,
      headerClassName: showClientColumn ? 'max-w-[160px]' : 'max-w-[220px]',
      render: (row) => (
        <span
          className={cn(
            'block truncate text-xs text-muted-foreground',
            showClientColumn ? '' : 'max-w-[220px]',
          )}
        >
          {row.traineeName}
        </span>
      ),
    },
  ];

  if (showClientColumn) {
    columns.push({
      key: 'clientName',
      label: 'Client',
      sortable: true,
      headerClassName: 'max-w-[140px]',
      render: (row: EvaluationRow) => (
        <span className="block max-w-[140px] truncate text-xs text-muted-foreground">
          {row.clientName}
        </span>
      ),
    });
  }

  columns.push(...buildEvaluationColumns(evaluations));
  return columns;
}
