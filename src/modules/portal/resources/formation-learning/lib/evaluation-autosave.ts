import type { TraineeAnswer } from '@/modules/quizzes/types';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import type { EvaluationAttemptResponse } from '@/shared/api/portal.api';
import { fromApiAnswer, toApiPayload } from './evaluation-attempt-utils';

interface Draft {
  answer: TraineeAnswer;
  revision: number;
  saved: number;
  pending: Promise<void> | null;
  error: boolean;
}

export interface AutosaveSnapshot {
  pending: boolean;
  failed: boolean;
  savedIds: string[];
  completed: EvaluationAttemptResponse | null;
}

/** A serial lane per question. Retries reuse the revision; edits always advance
 * it, including clears. No cleanup flush: React unmount is NOT a page exit.
 */
export class EvaluationAutosave {
  private drafts = new Map<string, Draft>();
  private listeners = new Set<() => void>();
  private stopped = false;
  private snapshot: AutosaveSnapshot = {
    pending: false,
    failed: false,
    savedIds: [],
    completed: null,
  };

  constructor(
    private attempt: ApiEvaluationAttempt,
    private pageSessionId: string,
    private send: (
      id: string,
      quizId: string,
      payload: Record<string, unknown>,
    ) => Promise<EvaluationAttemptResponse>,
    private canSave: () => boolean,
    private isCurrent: () => boolean = () => true,
  ) {
    for (const quiz of attempt.quizzes)
      this.drafts.set(quiz.id, {
        answer: fromApiAnswer(quiz),
        revision: quiz.answer_revision ?? 0,
        saved: quiz.answer_revision ?? 0,
        pending: null,
        error: false,
      });
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  getAnswers = () => Object.fromEntries([...this.drafts].map(([id, draft]) => [id, draft.answer]));

  private emit() {
    this.snapshot = {
      ...this.snapshot,
      pending: [...this.drafts.values()].some((draft) => draft.revision > draft.saved),
      failed: [...this.drafts.values()].some((draft) => draft.error),
      savedIds: [...this.drafts]
        .filter(([, d]) => d.revision > 0 && d.saved === d.revision)
        .map(([id]) => id),
    };
    this.listeners.forEach((listener) => listener());
  }

  change = (id: string, answer: TraineeAnswer) => {
    if (this.stopped || !this.isCurrent() || !this.canSave()) return;
    const draft = this.drafts.get(id);
    if (!draft) return;
    draft.answer = answer;
    draft.revision += 1;
    draft.error = false;
    this.emit();
    void this.drain(id);
  };

  stop() {
    this.stopped = true;
  }

  private drain(id: string): Promise<void> {
    const draft = this.drafts.get(id)!;
    if (draft.pending) return draft.pending;
    if (this.stopped || !this.isCurrent() || !this.canSave() || draft.saved === draft.revision)
      return Promise.resolve();
    // Defer the loop until pending is assigned, including immediately resolved mocks.
    draft.pending = Promise.resolve()
      .then(async () => {
        while (
          !this.stopped &&
          this.isCurrent() &&
          this.canSave() &&
          draft.saved < draft.revision
        ) {
          const revision = draft.revision;
          const quiz = this.attempt.quizzes.find((item) => item.id === id)!;
          try {
            const response = await this.send(this.attempt.id, id, {
              ...toApiPayload(quiz, draft.answer),
              answer_revision: revision,
              page_session_id: this.pageSessionId,
            });
            // Already-dispatched requests remain subject to backend ownership.
            // Never adopt their result or send the next queued edit as another identity.
            if (this.stopped || !this.isCurrent()) return;
            if (response.data.status === 'completed') {
              this.stopped = true;
              this.snapshot = { ...this.snapshot, completed: response };
            }
            draft.saved = revision;
            draft.error = false;
          } catch {
            if (this.stopped || !this.isCurrent()) return;
            draft.error = true;
            break;
          }
        }
      })
      .finally(() => {
        draft.pending = null;
        if (this.isCurrent()) this.emit();
      });
    return draft.pending;
  }

  retry = () => {
    for (const id of this.drafts.keys()) void this.drain(id);
  };

  async flush(): Promise<void> {
    await Promise.all([...this.drafts.keys()].map((id) => this.drain(id)));
    if (!this.stopped && [...this.drafts.values()].some((draft) => draft.saved < draft.revision)) {
      throw new Error('Certaines réponses ne sont pas enregistrées. Réessayez la sauvegarde.');
    }
  }
}
