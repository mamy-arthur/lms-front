import { StrictMode } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { AverageProgressIndicator } from '../components/AverageProgressIndicator';

describe('AverageProgressIndicator', () => {
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  let frames: Map<number, FrameRequestCallback>;
  let motionPreference: EventTarget & { matches: boolean };
  let nextFrameId: number;

  beforeEach(() => {
    frames = new Map();
    nextFrameId = 0;
    motionPreference = Object.assign(new EventTarget(), { matches: false });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn(() => motionPreference),
    });
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = ++nextFrameId;
      frames.set(id, callback);
      return id;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      frames.delete(id);
    });
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  function advanceFrame(timestamp: number) {
    act(() => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(timestamp));
    });
  }

  function expectProgress(value: number) {
    const progress = screen.getByRole('progressbar', { name: 'Progression moyenne des étudiants' });
    expect(progress).toHaveAttribute('aria-valuenow', String(value));
    expect(progress.querySelector('[data-slot="progress-indicator"]')).toHaveStyle({
      transform: `translateX(-${100 - value}%)`,
    });
    expect(screen.getByRole('paragraph')).toHaveTextContent(`${Math.round(value)} %`);
  }

  it('anime le pourcentage et la barre ensemble, puis s’arrête à la valeur finale', () => {
    const { rerender } = render(<AverageProgressIndicator value={64} />);
    expectProgress(0);

    advanceFrame(0);
    advanceFrame(450);
    expectProgress(56);
    expect(frames.size).toBe(1);

    advanceFrame(900);
    expectProgress(64);
    expect(frames.size).toBe(0);

    rerender(<AverageProgressIndicator value={64} />);
    expectProgress(64);
    expect(frames.size).toBe(0);
  });

  it('affiche directement la valeur finale si les animations sont réduites', () => {
    motionPreference.matches = true;
    render(<AverageProgressIndicator value={64} />);
    advanceFrame(0);

    expectProgress(64);
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(frames.size).toBe(0);
  });

  it('anime la variante de complétion avec un libellé propre à la formation', () => {
    render(
      <AverageProgressIndicator
        value={40}
        variant="completion"
        ariaLabel="Taux de complétion de Communiquer avec impact"
      />,
    );
    const progress = screen.getByRole('progressbar', {
      name: 'Taux de complétion de Communiquer avec impact',
    });
    expect(screen.getByText('Taux de complétion')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(progress).toHaveClass('h-1', '**:data-[slot=progress-indicator]:bg-blue-600');

    advanceFrame(0);
    advanceFrame(450);
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(progress).toHaveAttribute('aria-valuenow', '35');
    expect(progress).toHaveAttribute('aria-valuetext', '35 % des inscrits ont terminé avec succès');
    expect(progress.querySelector('[data-slot="progress-indicator"]')).toHaveStyle({
      transform: 'translateX(-65%)',
    });

    advanceFrame(900);
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(progress).toHaveAttribute('aria-valuenow', '40');
    expect(progress).toHaveAttribute('aria-valuetext', '40 % des inscrits ont terminé avec succès');
    expect(frames.size).toBe(0);
  });

  it('conserve la valeur de chaque formation lors d’un réordonnancement', () => {
    const renderIndicators = (values: number[]) => (
      <>
        {values.map((value) => (
          <AverageProgressIndicator
            key={value}
            value={value}
            variant="completion"
            ariaLabel={`Formation ${value}`}
          />
        ))}
      </>
    );
    const { rerender } = render(renderIndicators([40, 50]));
    advanceFrame(0);
    advanceFrame(900);

    rerender(renderIndicators([50, 40]));
    expect(screen.getByRole('progressbar', { name: 'Formation 40' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
    expect(screen.getByRole('progressbar', { name: 'Formation 50' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(frames.size).toBe(0);
  });

  it('arrête l’animation si la préférence de mouvement change', () => {
    render(<AverageProgressIndicator value={64} />);
    advanceFrame(0);
    advanceFrame(450);

    act(() => {
      motionPreference.matches = true;
      motionPreference.dispatchEvent(new Event('change'));
    });

    expectProgress(64);
    expect(frames.size).toBe(0);
  });

  it('annule les frames et retire l’écouteur au démontage, même en StrictMode', () => {
    const removeListener = jest.spyOn(motionPreference, 'removeEventListener');
    const { unmount } = render(
      <StrictMode>
        <AverageProgressIndicator value={64} />
      </StrictMode>,
    );
    advanceFrame(0);
    expect(frames.size).toBe(1);

    unmount();
    expect(frames.size).toBe(0);
    expect(removeListener).toHaveBeenLastCalledWith('change', expect.any(Function));
  });

  it.each([0, 100])('termine correctement à %i pour cent', (value) => {
    render(<AverageProgressIndicator value={value} />);
    advanceFrame(0);
    advanceFrame(900);

    expectProgress(value);
    expect(frames.size).toBe(0);
  });
});
