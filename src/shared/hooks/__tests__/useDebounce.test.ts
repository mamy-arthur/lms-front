/**
 * Tests unitaires — useDebounce()
 *
 * On utilise `jest.useFakeTimers()` pour contrôler le temps sans attendre
 * de vraies millisecondes. `act()` est requis pour que React flush les mises
 * à jour d'état déclenchées par les timers.
 */
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retourne la valeur initiale immédiatement', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('ne met pas à jour avant la fin du délai', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } },
    );

    rerender({ value: 'updated', delay: 300 });

    // Avant la fin du timer, la valeur ne doit pas avoir changé.
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Après le délai exact, la mise à jour est appliquée.
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it("n'applique que la dernière valeur en cas de saisies rapides", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'ab' });
    rerender({ value: 'abc' });
    rerender({ value: 'abcd' });

    // Pendant la frappe, la valeur debounced reste la valeur initiale.
    expect(result.current).toBe('a');

    // Après 300 ms sans nouvelle saisie, seule la dernière valeur est retournée.
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('abcd');
  });

  it('utilise 300 ms comme délai par défaut', () => {
    const { result, rerender } = renderHook(({ value }: { value: number }) => useDebounce(value), {
      initialProps: { value: 0 },
    });

    rerender({ value: 42 });

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe(0);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(42);
  });
});
