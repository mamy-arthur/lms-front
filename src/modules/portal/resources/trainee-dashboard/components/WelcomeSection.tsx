import { Flame, Sun } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WelcomeSectionProps {
  firstName: string;
  streak: number;
}

export function WelcomeSection({ firstName, streak }: WelcomeSectionProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const messages = [
    "Chaque leçon apprise aujourd'hui est un pas de plus vers l'excellence.",
    'La constance est la clé du succès. Continuez sur votre lancée !',
    'Votre progression inspire. Restez focalisé, le sommet est proche.',
    "L'apprentissage est un investissement qui rapporte toujours.",
  ];
  const message = messages[new Date().getDay() % messages.length];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-8 py-8 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/3 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-200">
            <Sun className="h-4 w-4" />
            <span className="text-sm font-medium">{greeting} !</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {firstName} 👋
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-indigo-100">{message}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge className="flex items-center gap-1.5 border-0 bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30">
            <Flame className="h-4 w-4 text-amber-300" />
            {streak} jours consécutifs
          </Badge>
          <p className="text-xs text-indigo-200">Série d'apprentissage active</p>
        </div>
      </div>
    </div>
  );
}
