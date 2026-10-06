'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { UserDetailKind } from '@/shared/types/user-detail.types';
import { isOnPath, USERS_LIST_URL_CHANGE } from './useUsersListParams';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(USERS_LIST_URL_CHANGE, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(USERS_LIST_URL_CHANGE, onChange);
  };
}

const serverSnapshot = () => null;

const OPENED_BY_LIST = 'userDetailOpenedByList';
// history.back() is asynchronous: ignore further closes until its popstate has fired.
const BACK_TIMEOUT_MS = 500;

export function useUserDetailDrawer(path: string, kind: UserDetailKind) {
  const getSnapshot = useCallback(() => {
    if (!isOnPath(path)) return null;
    const query = new URLSearchParams(window.location.search);
    // A hand-written URL containing both targets must never open two sheets.
    if (kind === 'trainee' && query.get('manager')) return null;
    return query.get(kind) || null;
  }, [path, kind]);
  const id = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const lastId = useRef<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const backPending = useRef(false);
  useEffect(() => {
    if (id) lastId.current = id;
  }, [id]);

  const open = (userId: string) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const url = new URL(window.location.href);
    url.searchParams.delete('trainee');
    url.searchParams.delete('manager');
    url.searchParams.set(kind, userId);
    window.history.pushState({ [OPENED_BY_LIST]: true }, '', `${path}${url.search}${url.hash}`);
    window.dispatchEvent(new Event(USERS_LIST_URL_CHANGE));
  };

  const close = () => {
    const url = new URL(window.location.href);
    // Closing one kind must never dismiss the drawer of the other kind.
    if (!url.searchParams.has(kind)) return;
    // Pop the entry pushed by open() so "Back" does not land on an identical list entry.
    if (window.history.state?.[OPENED_BY_LIST]) {
      if (backPending.current) return;
      backPending.current = true;
      const settle = () => {
        backPending.current = false;
        window.removeEventListener('popstate', settle);
      };
      window.addEventListener('popstate', settle);
      // A back() that never pops must not lock the drawer closed forever.
      window.setTimeout(settle, BACK_TIMEOUT_MS);
      window.history.back();
      return;
    }
    url.searchParams.delete('trainee');
    url.searchParams.delete('manager');
    window.history.replaceState(null, '', `${path}${url.search}${url.hash}`);
    window.dispatchEvent(new Event(USERS_LIST_URL_CHANGE));
  };

  const restoreFocus = (event: Event) => {
    const trigger = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-user-detail-trigger]'),
    ).find((element) => element.dataset.userDetailTrigger === lastId.current);
    const target = trigger ?? (opener.current?.isConnected ? opener.current : null);
    opener.current = null;
    if (target) {
      event.preventDefault();
      target.focus();
    }
  };

  return { id, open, close, restoreFocus };
}
