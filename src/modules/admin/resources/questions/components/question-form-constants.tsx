import { GitCompareArrows, CircleCheckBig, CircleDot, SquareCheckBig } from 'lucide-react';
import type { ReactNode } from 'react';

export const TYPE_ICONS: Record<string, { icon: ReactNode; color: string }> = {
  true_false: {
    icon: <CircleCheckBig className="size-8" />,
    color: 'text-emerald-500',
  },
  single_choice: {
    icon: <CircleDot className="size-8" />,
    color: 'text-blue-500',
  },
  multiple_choice: {
    icon: <SquareCheckBig className="size-8" />,
    color: 'text-violet-500',
  },
  matching: {
    icon: <GitCompareArrows className="size-8" />,
    color: 'text-amber-500',
  },
};
