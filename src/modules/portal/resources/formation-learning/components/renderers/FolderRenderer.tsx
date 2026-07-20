import { FolderOpen } from 'lucide-react';

export default function FolderRenderer() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div
        className="flex size-16 items-center justify-center rounded-2xl"
        style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
      >
        <FolderOpen className="size-8" style={{ color: 'var(--color-primary)' }} />
      </div>
      <p className="text-lg font-medium text-white">Dossier</p>
      <p className="text-slate-400 text-sm max-w-sm">
        Sélectionnez un contenu dans le dossier via la barre latérale.
      </p>
    </div>
  );
}
