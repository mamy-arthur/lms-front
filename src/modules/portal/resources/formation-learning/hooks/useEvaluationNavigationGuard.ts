'use client';

import { useEffect, type RefObject } from 'react';
import { useEvaluationDocument } from './useEvaluationDocument';

/** App Router has no beforePopState. Capture links before Next's handlers and
 * fence the current history entry before its popstate listener can navigate.
 * No submit on cleanup, beforeunload, or visibilitychange: recovery is server-side.
 */
export function useEvaluationNavigationGuard(
  locked: boolean,
  root: RefObject<HTMLDivElement | null>,
) {
  const documentSession = useEvaluationDocument();
  useEffect(() => {
    if (!locked || !root.current || !documentSession) return;
    documentSession.navigationLocks += 1;
    const container = root.current;
    const url = window.location.href;
    const state = { ...window.history.state, learneoEvaluationFence: true };
    if (!window.history.state?.learneoEvaluationFence) window.history.pushState(state, '', url);

    const block = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('a[href]') || !container.contains(target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const back = (event: PopStateEvent) => {
      event.stopImmediatePropagation();
      window.history.pushState(state, '', url);
    };
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    // Disable keyboard focus and expose disabled surrounding navigation to AT,
    // not just a visual overlay. Restore the pre-existing inert state on cleanup.
    const siblings = new Map<HTMLElement, boolean>();
    let node: HTMLElement = container;
    while (node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling !== node && sibling instanceof HTMLElement) {
          siblings.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
      node = node.parentElement;
      if (node === document.body) break;
    }
    document.addEventListener('click', block, true);
    document.addEventListener('auxclick', block, true);
    window.addEventListener('popstate', back, true);
    window.addEventListener('beforeunload', unload);
    return () => {
      documentSession.navigationLocks -= 1;
      siblings.forEach((inert, element) => {
        element.inert = inert;
      });
      document.removeEventListener('click', block, true);
      document.removeEventListener('auxclick', block, true);
      window.removeEventListener('popstate', back, true);
      window.removeEventListener('beforeunload', unload);
      // Do not call history.back() here: StrictMode/HMR cleanup is not navigation.
    };
  }, [locked, root, documentSession]);
}
