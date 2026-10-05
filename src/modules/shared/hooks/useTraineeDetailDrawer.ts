'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
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

export function useTraineeDetailDrawer(path: string) {
  const getSnapshot = useCallback(
    () =>
      window.location.pathname === path
        ? new URLSearchParams(window.location.search).get('trainee') || null
        : null,
    [path],
  );
  const id = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const lastId = useRef<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (id) lastId.current = id;
  }, [id]);

  const open = (traineeId: string) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const url = new URL(window.location.href);
    url.searchParams.set('trainee', traineeId);
    window.history.pushState(null, '', `${path}${url.search}${url.hash}`);
    window.dispatchEvent(new Event(USERS_LIST_URL_CHANGE));
  };

  const close = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('trainee');
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
