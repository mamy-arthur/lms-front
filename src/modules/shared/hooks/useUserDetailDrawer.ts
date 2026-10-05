'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { UserDetailKind } from '@/shared/types/user-detail.types';
import { USERS_LIST_URL_CHANGE } from './useUsersListParams';

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
let backPending = false;

export function useUserDetailDrawer(path: string, kind: UserDetailKind) {
  const getSnapshot = useCallback(() => {
    if (window.location.pathname !== path) return null;
    const query = new URLSearchParams(window.location.search);
    // A hand-written URL containing both targets must never open two sheets.
    if (kind === 'trainee' && query.get('manager')) return null;
    return query.get(kind) || null;
  }, [path, kind]);
  const id = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const lastId = useRef<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
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
    const isOpen = url.searchParams.has('trainee') || url.searchParams.has('manager');
    // Pop the entry pushed by open() so "Back" does not land on an identical list entry.
    if (isOpen && window.history.state?.[OPENED_BY_LIST]) {
      if (backPending) return;
      backPending = true;
      window.addEventListener('popstate', () => (backPending = false), { once: true });
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
