import { ClipboardList } from 'lucide-react';

export default function SurveyRenderer() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div
        className="flex size-16 items-center justify-center rounded-2xl"
        style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
      >
        <ClipboardList className="size-8" style={{ color: 'var(--color-primary)' }} />
      </div>
      <p className="text-lg font-medium text-white">Sondage</p>
      <p className="text-slate-400 text-sm max-w-sm">Ce sondage sera disponible prochainement.</p>
    </div>
  );
}
