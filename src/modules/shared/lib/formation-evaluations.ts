/**
 * Domain types for the new canonical evaluation data model.
 *
 * Structure:
 *   Formation
 *     └─ FormationEvaluationDef[]  (the named exams/tests)
 *           └─ TraineeResult[]    (one score per trainee)
 *
 * A dedicated adapter converts this to the flat EvaluationNote[] format
 * expected by EvaluationNotesTable (trainee-per-row, evaluation-per-column).
 */

import type { EvaluationNote } from './evaluation-notes';

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface TraineeResult {
  traineeId: string;
  traineeName: string;
  clientId: string;
  clientName: string;
  /** Points earned by this trainee for this evaluation. */
  score: number;
}

export interface FormationEvaluationDef {
  id: string;
  title: string;
  /** Maximum points achievable — same for all trainees. */
  maxScore: number;
  /** Optional weighting factor (not used by the table, reserved for future use). */
  coefficient?: number;
  results: TraineeResult[];
}

export interface FormationEvaluationsRecord {
  /** References a formation id (e.g. StoreFormation.id). */
  formationId: string;
  evaluations: FormationEvaluationDef[];
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Transforms a FormationEvaluationsRecord into the flat EvaluationNote[] format
 * consumed by EvaluationNotesTable.
 *
 * The table expects one row per trainee with a score summary for each evaluation.
 */
export function toEvaluationNotes(
  record: FormationEvaluationsRecord,
  formationName: string,
  formationCoverImage?: string,
  formationCategory?: string,
): EvaluationNote[] {
  // Collect all unique trainees encountered across every evaluation
  const traineeMap = new Map<
    string,
    { traineeName: string; clientId: string; clientName: string }
  >();

  for (const evalDef of record.evaluations) {
    for (const result of evalDef.results) {
      if (!traineeMap.has(result.traineeId)) {
        traineeMap.set(result.traineeId, {
          traineeName: result.traineeName,
          clientId: result.clientId,
          clientName: result.clientName,
        });
      }
    }
  }

  // Build one EvaluationNote per trainee
  const notes: EvaluationNote[] = [];
  let noteIndex = 1;

  for (const [traineeId, traineeInfo] of traineeMap) {
    const evaluations = record.evaluations.map((evalDef) => {
      const result = evalDef.results.find((r) => r.traineeId === traineeId);
      return {
        id: evalDef.id,
        label: evalDef.title,
        pointsEarned: result?.score ?? 0,
        pointsMax: evalDef.maxScore,
      };
    });

    notes.push({
      id: `${record.formationId}-${String(noteIndex).padStart(3, '0')}`,
      traineeId,
      traineeName: traineeInfo.traineeName,
      clientId: traineeInfo.clientId,
      clientName: traineeInfo.clientName,
      formationId: record.formationId,
      formationName,
      formationCoverImage,
      formationCategory,
      evaluations,
    });

    noteIndex++;
  }

  return notes;
}

/**
 * Converts all FormationEvaluationsRecords into a single flat EvaluationNote[].
 * Useful for the list screen that needs data across all formations.
 */
export function allFormationEvaluationsToNotes(
  records: FormationEvaluationsRecord[],
  getFormationMeta: (formationId: string) =>
    | {
        name: string;
        coverImage?: string;
        category?: string;
      }
    | undefined,
): EvaluationNote[] {
  return records.flatMap((record) => {
    const meta = getFormationMeta(record.formationId);
    if (!meta) return [];
    return toEvaluationNotes(record, meta.name, meta.coverImage, meta.category);
  });
}
