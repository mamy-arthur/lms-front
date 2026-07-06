type Props = {
  completed: number;
  enrollments: number;
};

export function CourseProgress({ completed, enrollments }: Props) {
  const percentage = Math.round((completed / enrollments) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-gray-900">Progression</span>

        <span className="text-xs font-medium">{percentage}%</span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-(--color-primary)"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
