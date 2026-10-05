interface HistoryFence {
  owners: Set<symbol>;
  retired: boolean;
  dispose: () => void;
  release: () => void;
}

declare global {
  interface Window {
    __learneoEvaluationHistoryFence?: HistoryFence;
  }
}

/** One browser-history fence, even when effects or document identities change. */
export function acquireEvaluationHistoryFence(): () => void {
  const owner = Symbol();
  // A new push will discard the old forward sentinel. Keep at most one listener.
  if (window.__learneoEvaluationHistoryFence?.retired) {
    window.__learneoEvaluationHistoryFence.dispose();
  }
  const fence = window.__learneoEvaluationHistoryFence ?? createFence();
  fence.owners.add(owner);
  return () => {
    fence.owners.delete(owner);
    // StrictMode and same-turn remounts reacquire before this final-lock check.
    void Promise.resolve().then(() => {
      if (fence.owners.size === 0) fence.release();
    });
  };
}

function createFence(): HistoryFence {
  const id = crypto.randomUUID();
  const url = window.location.href;
  let restoring = false;
  let state = { ...window.history.state };
  delete state.learneoEvaluationFence;
  delete state.learneoEvaluationFenceBase;

  const isBase = () =>
    window.location.href === url && window.history.state?.learneoEvaluationFenceBase === id;
  const isFence = () =>
    window.location.href === url && window.history.state?.learneoEvaluationFence === id;
  const pushFence = () => {
    window.history.pushState({ ...state, learneoEvaluationFence: id }, '', url);
  };
  const dispose = () => {
    window.removeEventListener('popstate', onPopState, true);
    if (window.__learneoEvaluationHistoryFence === fence) {
      delete window.__learneoEvaluationHistoryFence;
    }
  };

  const onPopState = (event: PopStateEvent) => {
    if (fence.retired) {
      // History has no delete-entry API: back() leaves a forward sentinel.
      // Neutralize it too, so Forward cannot resurrect the duplicate Back step.
      if (isFence()) {
        event.stopImmediatePropagation();
        restoring = true;
        window.history.back();
      } else if (restoring) {
        restoring = false;
        if (window.location.href === url) event.stopImmediatePropagation();
      }
      return;
    }
    if (restoring && isBase()) {
      event.stopImmediatePropagation();
      restoring = false;
      if (fence.owners.size > 0) {
        // A new evaluation acquired the fence while history.back() was pending.
        pushFence();
      } else {
        // Consume the same-URL entry and retain the latest Next.js history tree,
        // which may have changed while the evaluation was locked.
        window.history.replaceState(state, '', url);
        fence.retired = true;
      }
      return;
    }
    if (fence.owners.size === 0) {
      // A real navigation won the race. Never restore an obsolete URL/tree.
      dispose();
      return;
    }
    event.stopImmediatePropagation();
    restoring = false;
    if (!isBase()) {
      // A multi-entry Back may have skipped the base. Recreate a same-URL
      // base before truncating the forward history with the guarded entry.
      window.history.pushState({ ...state, learneoEvaluationFenceBase: id }, '', url);
    }
    pushFence();
  };

  const fence: HistoryFence = {
    owners: new Set(),
    retired: false,
    dispose,
    release: () => {
      if (window.__learneoEvaluationHistoryFence !== fence || restoring || fence.retired) return;
      if (!isFence()) {
        // An unmount caused by an actual route change must not navigate back.
        dispose();
        return;
      }
      state = { ...window.history.state };
      delete state.learneoEvaluationFence;
      delete state.learneoEvaluationFenceBase;
      restoring = true;
      window.history.back();
    },
  };
  window.__learneoEvaluationHistoryFence = fence;
  window.history.replaceState({ ...state, learneoEvaluationFenceBase: id }, '', url);
  pushFence();
  window.addEventListener('popstate', onPopState, true);
  return fence;
}
