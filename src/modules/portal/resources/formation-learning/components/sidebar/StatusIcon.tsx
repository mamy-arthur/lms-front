import { CheckCircle, Lock, PlayCircle, File } from 'lucide-react';
import type { ProgressStatus } from '../../lib/types';

export default function StatusIcon({ status }: { status: ProgressStatus }) {
  if (status === 'completed') {
    return (
      <div className="bg-emerald-100 p-2 rounded-2xl">
        <CheckCircle className="size-3 text-emerald-500" />{' '}
      </div>
    );
  }
  if (status === 'in_progress') {
    return <PlayCircle className="h-3 w-3 shrink-0" style={{ color: 'var(--color-primary)' }} />;
  }
  if (status === 'locked') {
    return (
      <div className="bg-gray-300 p-2 rounded-2xl">
        <Lock className="size-3 text-white" />{' '}
      </div>
    );
  }
  return (
    <div className="bg-(--color-primary)/80 p-2 rounded-2xl">
      <File className="size-3 text-white" />{' '}
    </div>
  );
}
