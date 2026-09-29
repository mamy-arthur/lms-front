import { render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ProgressCard } from '../components/chart/chart-radial-text';

let mockChartSize = 224;

// Supply measured dimensions without replacing the real Recharts rendering.
jest.mock('@/components/ui/chart', () => {
  const { cloneElement } = jest.requireActual<typeof import('react')>('react');
  return {
    ChartContainer: ({ children }: { children: ReactElement<{ width: number; height: number }> }) =>
      cloneElement(children, { width: mockChartSize, height: mockChartSize }),
  };
});

it('redimensionne les deux cercles de progression avec la surface disponible', async () => {
  const { container, rerender } = render(<ProgressCard students={[]} />);

  for (const size of [224, 160, 192, 224]) {
    mockChartSize = size;
    rerender(<ProgressCard students={[]} />);

    await waitFor(() => {
      const circles = container.querySelectorAll('.recharts-polar-grid-concentric-circle');
      const radius = (size - 24) / 2;
      expect(circles).toHaveLength(2);
      expect(Number(circles[0].getAttribute('r'))).toBeCloseTo(radius);
      expect(Number(circles[1].getAttribute('r'))).toBeCloseTo(radius * 0.8);
      for (const circle of circles) {
        expect(Number(circle.getAttribute('cx'))).toBe(size / 2);
        expect(Number(circle.getAttribute('cy'))).toBe(size / 2);
      }
    });
  }
});
