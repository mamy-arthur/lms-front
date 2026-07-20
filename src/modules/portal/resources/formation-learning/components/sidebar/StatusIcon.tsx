import { Check, Lock, PlayCircle } from 'lucide-react';
import type { ProgressStatus } from '../../lib/types';

export default function StatusIcon({ status }: { status: ProgressStatus }) {
  if (status === 'completed') {
    return <Check className="h-3 w-3 shrink-0 text-emerald-500" />;
  }
  if (status === 'in_progress') {
    return <PlayCircle className="h-3 w-3 shrink-0" style={{ color: 'var(--color-primary)' }} />;
  }
  if (status === 'locked') {
    return <Lock className="h-3 w-3 shrink-0 text-slate-300" />;
  }
  return <div className="h-3 w-3 shrink-0 rounded-full border border-slate-200" />;
}
