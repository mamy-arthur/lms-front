import { StrictMode, Suspense, useLayoutEffect } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

const query = '(max-width: 767px)';
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
let matches: boolean;
let listeners: Set<() => void>;
let mediaQuery: MediaQueryList;
let errors: jest.SpyInstance;

function setMobile(value: boolean) {
  matches = value;
  for (const listener of listeners) listener();
}

function Viewport() {
  return <span>{useIsMobile() ? 'mobile' : 'desktop'}</span>;
}

beforeEach(() => {
  matches = false;
  listeners = new Set();
  mediaQuery = {
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: jest.fn((_event: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: jest.fn((_event: string, listener: () => void) =>
      listeners.delete(listener),
    ),
  } as unknown as MediaQueryList;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn(() => mediaQuery),
  });
  errors = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  const warnings = errors.mock.calls;
  jest.restoreAllMocks();
  if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia);
  else Reflect.deleteProperty(window, 'matchMedia');
  expect(listeners.size).toBe(0);
  expect(warnings).toEqual([]);
});

it.each([false, true])('reads the media query on the first client render (mobile=%s)', (mobile) => {
  matches = mobile;
  const rendered: boolean[] = [];
  const { result } = renderHook(() => {
    const value = useIsMobile();
    rendered.push(value);
    return value;
  });
  expect(result.current).toBe(mobile);
  expect(rendered[0]).toBe(mobile);
  expect(window.matchMedia).toHaveBeenCalledWith(query);
  expect(listeners.size).toBe(1);
});

it('updates in both directions from matchMedia, without relying on innerWidth', () => {
  const { result } = renderHook(() => useIsMobile());
  act(() => setMobile(true));
  expect(result.current).toBe(true);
  act(() => setMobile(false));
  expect(result.current).toBe(false);
});

it('does not resubscribe on ordinary rerenders and removes the exact listener on unmount', () => {
  const { rerender, unmount } = renderHook(() => useIsMobile());
  const listener = [...listeners][0];
  rerender();
  expect(mediaQuery.addEventListener).toHaveBeenCalledTimes(1);
  unmount();
  expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', listener);
  expect(listeners.size).toBe(0);
  act(() => setMobile(true));
});

it('keeps one live subscription through StrictMode remount checks', () => {
  const { result, unmount } = renderHook(() => useIsMobile(), { wrapper: StrictMode });
  expect(listeners.size).toBe(1);
  act(() => setMobile(true));
  expect(result.current).toBe(true);
  unmount();
  expect(listeners.size).toBe(0);
});

it('handles independent consumers without removing the other subscription', () => {
  const first = renderHook(() => useIsMobile());
  const second = renderHook(() => useIsMobile());
  expect(listeners.size).toBe(2);
  first.unmount();
  act(() => setMobile(true));
  expect(second.result.current).toBe(true);
  expect(listeners.size).toBe(1);
});

it('rechecks a viewport change between render and subscription', () => {
  const { result } = renderHook(() => {
    useLayoutEffect(() => {
      matches = true;
    }, []);
    return useIsMobile();
  });
  expect(result.current).toBe(true);
});

it('does not subscribe during a suspended render that never mounts', () => {
  const pending = new Promise<void>(() => {});
  function SuspendedViewport(): never {
    useIsMobile();
    throw pending;
  }
  const { unmount } = render(
    <Suspense fallback={<span>Loading</span>}>
      <SuspendedViewport />
    </Suspense>,
  );
  expect(screen.getByText('Loading')).toBeVisible();
  expect(mediaQuery.addEventListener).not.toHaveBeenCalled();
  act(() => setMobile(true));
  unmount();
  expect(listeners.size).toBe(0);
});

it('hydrates the server fallback on a mobile screen without a mismatch', async () => {
  matches = true;
  const html = renderToString(<Viewport />);
  expect(html).toContain('desktop');
  expect(window.matchMedia).not.toHaveBeenCalled();
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  const onRecoverableError = jest.fn();
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, <Viewport />, { onRecoverableError });
    });
    expect(container).toHaveTextContent('mobile');
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(listeners.size).toBe(1);
    act(() => setMobile(false));
    expect(container).toHaveTextContent('desktop');
  } finally {
    await act(async () => root?.unmount());
    container.remove();
  }
});