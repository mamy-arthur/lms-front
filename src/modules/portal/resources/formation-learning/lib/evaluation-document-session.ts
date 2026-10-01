import type { EvaluationAutosave } from './evaluation-autosave';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import { selectSessionIdentity, useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';

export interface EvaluationClock {
  deadline: number | null;
  serverNow: number;
}

export interface DocumentSession {
  readonly id: string;
  readonly identity: string;
  readonly available: boolean;
  clocks: Map<string, EvaluationClock>;
  saves: Map<string, EvaluationAutosave>;
  frozen: Set<string>;
  navigationLocks: number;
}

interface DocumentOwner {
  stores: readonly unknown[];
  unsubscribe: Array<() => void>;
  listeners: Set<() => void>;
}

declare global {
  interface Window {
    __learneoEvaluationDocument?: DocumentSession;
    __learneoEvaluationDocumentOwner?: DocumentOwner;
  }
}

function runtimeIdentity(): string {
  const auth = useAuthStore.getState();
  const simulation = useSimulationStore.getState();
  return JSON.stringify([
    selectSessionIdentity(auth),
    useTenantStore.getState().tenant?.id ?? null,
    auth.simulatedRole,
    simulation.epoch,
    simulation.phase,
    simulation.session?.simulated_role ?? null,
    simulation.session?.tenant_id ?? null,
  ]);
}

function synchronizeDocument(): DocumentSession {
  const identity = runtimeIdentity();
  const previous = window.__learneoEvaluationDocument;
  if (previous?.identity === identity) return previous;
  if (previous) {
    // Deleting the singleton alone would leave asynchronous drains alive.
    previous.saves.forEach((manager) => manager.stop());
    previous.saves.clear();
    previous.clocks.clear();
    previous.frozen.clear();
    // Guard effects still own their old document's locks/listeners. Their
    // cleanup must balance those locks, never decrement the new document.
  }
  const phase = useSimulationStore.getState().phase;
  return (window.__learneoEvaluationDocument = {
    id: crypto.randomUUID(),
    identity,
    available: !!useAuthStore.getState().user && (phase === 'idle' || phase === 'ready'),
    clocks: new Map(),
    saves: new Map(),
    frozen: new Set(),
    navigationLocks: 0,
  });
}

function documentOwner(): DocumentOwner {
  const stores = [useAuthStore, useTenantStore, useSimulationStore] as const;
  const previous = window.__learneoEvaluationDocumentOwner;
  if (previous && stores.every((store, index) => previous.stores[index] === store)) return previous;
  // HMR retains one subscription per store. If a store itself is replaced,
  // rebind it without dropping the mounted hooks' subscriptions.
  previous?.unsubscribe.forEach((unsubscribe) => unsubscribe());
  const owner: DocumentOwner = {
    stores,
    unsubscribe: [],
    listeners: previous?.listeners ?? new Set(),
  };
  window.__learneoEvaluationDocumentOwner = owner;
  const synchronize = () => {
    const previousDocument = window.__learneoEvaluationDocument;
    const next = synchronizeDocument();
    if (previousDocument !== next) owner.listeners.forEach((listener) => listener());
  };
  owner.unsubscribe = stores.map((store) => store.subscribe(synchronize));
  return owner;
}

/** Deliberately NOT localStorage/sessionStorage: a reload must get a new UUID.
 * Window ownership survives StrictMode, same-identity remounts and module HMR.
 */
export function evaluationDocument(): DocumentSession {
  documentOwner();
  return synchronizeDocument();
}

export function subscribeEvaluationDocument(listener: () => void): () => void {
  const owner = documentOwner();
  owner.listeners.add(listener);
  return () => {
    owner.listeners.delete(listener);
  };
}

/** Compare the captured document too: A -> B -> A must never revive A's work. */
export function isEvaluationDocumentCurrent(document: DocumentSession): boolean {
  return (
    window.__learneoEvaluationDocument === document && document.identity === runtimeIdentity()
  );
}

export function anchorEvaluationClock(
  attempt: ApiEvaluationAttempt,
  document = evaluationDocument(),
): EvaluationClock {
  if (!isEvaluationDocumentCurrent(document)) {
    throw new Error('Le contexte de cette tentative a changé. Vérifiez à nouveau la session.');
  }
  const previous = document.clocks.get(attempt.id);
  const serverNow = Date.parse(attempt.server_now ?? '');
  const expiresAt = Date.parse(attempt.expires_at ?? '');
  const timed = attempt.expires_at != null || (attempt.time_limit_minutes ?? 0) > 0;
  if (timed && (!Number.isFinite(serverNow) || !Number.isFinite(expiresAt))) {
    throw new Error("L'horloge de cette évaluation est indisponible. Réessayez la vérification.");
  }
  // Ignore older asynchronous responses; even newer responses can only shorten
  // the deadline, never replenish the budget (network latency / stale polls).
  if (previous && (!Number.isFinite(serverNow) || serverNow <= previous.serverNow)) return previous;
  const candidate = timed ? performance.now() + Math.max(0, expiresAt - serverNow) : null;
  const clock = {
    serverNow,
    deadline:
      previous?.deadline != null
        ? Math.min(previous.deadline, candidate ?? previous.deadline)
        : candidate,
  };
  document.clocks.set(attempt.id, clock);
  return clock;
}

export function evaluationExpired(attemptId: string, document = evaluationDocument()): boolean {
  const deadline = document.clocks.get(attemptId)?.deadline;
  return deadline != null && performance.now() >= deadline;
}

export function isEvaluationNavigationLocked(): boolean {
  return typeof window !== 'undefined' && evaluationDocument().navigationLocks > 0;
}
