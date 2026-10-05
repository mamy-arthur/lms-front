import { act, renderHook } from '@testing-library/react';
import { useEvaluationDeadline } from '../useEvaluationDeadline';
import { anchorEvaluationClock, evaluationDocument } from '../../lib/evaluation-document-session';
import { evaluationAttempt } from '../../lib/__fixtures__/evaluation-attempt';

describe('Échéance ancrée sur le temps serveur', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    delete window.__learneoEvaluationDocument;
  });
  afterEach(() => {
    jest.useRealTimers();
    delete window.__learneoEvaluationDocument;
  });

  it('ne compte pas avant le démarrage ni pour une tentative sans limite', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useEvaluationDeadline(id),
      { initialProps: { id: null as string | null } },
    );
    expect(result.current.remaining).toBeNull();
    anchorEvaluationClock(evaluationAttempt());
    rerender({ id: 'attempt-1' });
    expect(result.current.remaining).toBeNull();
  });

  it('ignore les changements de date locale et expire avec performance.now', () => {
    anchorEvaluationClock(
      evaluationAttempt({ time_limit_minutes: 1, expires_at: '2026-10-01T12:01:00.000Z' }),
    );
    const { result } = renderHook(() => useEvaluationDeadline('attempt-1'));
    expect(result.current.formatted).toBe('01:00');
    act(() => {
      jest.setSystemTime(new Date('2099-01-01'));
      jest.advanceTimersByTime(15_000);
    });
    expect(result.current.remaining).toBe(45);
    act(() => {
      jest.setSystemTime(new Date('1970-01-01'));
      jest.advanceTimersByTime(45_000);
    });
    expect(result.current).toMatchObject({ remaining: 0, expired: true, formatted: '00:00' });
  });

  it('conserve le compteur au remontage sans prolongation par une réponse tardive', () => {
    const attempt = evaluationAttempt({ expires_at: '2026-10-01T12:01:00.000Z' });
    anchorEvaluationClock(attempt);
    const first = renderHook(() => useEvaluationDeadline('attempt-1'));
    act(() => jest.advanceTimersByTime(20_000));
    first.unmount();
    anchorEvaluationClock(attempt); // Delayed first poll, same server_now.
    anchorEvaluationClock({ ...attempt, server_now: '2026-10-01T12:00:01.000Z' }); // Newer but delayed.
    const second = renderHook(() => useEvaluationDeadline('attempt-1'));
    expect(second.result.current.remaining).toBe(40);
    anchorEvaluationClock({ ...attempt, server_now: '2026-10-01T12:00:50.000Z' });
    act(() => jest.advanceTimersByTime(250));
    expect(second.result.current.remaining).toBe(10);
  });

  it('refuse une tentative chronométrée dont le contrat horaire est invalide', () => {
    expect(() => anchorEvaluationClock(evaluationAttempt({ time_limit_minutes: 5 }))).toThrow(
      'horloge',
    );
  });

  it('partage un UUID pendant le HMR sans le conserver après rechargement du document', () => {
    const id = evaluationDocument().id;
    jest.isolateModules(() => {
      const reloaded = jest.requireActual<typeof import('../../lib/evaluation-document-session')>(
        '../../lib/evaluation-document-session',
      );
      expect(reloaded.evaluationDocument().id).toBe(id);
    });
    expect(Object.values(window.sessionStorage)).not.toContain(id);
    expect(Object.values(window.localStorage)).not.toContain(id);
    delete window.__learneoEvaluationDocument;
    expect(evaluationDocument().id).not.toBe(id);
  });
});
