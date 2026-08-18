interface ProgressRingProps {
  progress: number;
  size?: number;
}

export function ProgressRing({ progress, size = 120 }: ProgressRingProps) {
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress / 100);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-bold text-slate-800">{progress}%</span>{' '}
      </div>
    </div>
  );
}
