'use client';

import { useTenant } from '@/shared/hooks/useTenant';
import { BookOpen, GraduationCap, Sparkles, Users } from 'lucide-react';

export function LoginBrandingPanel() {
  const { tenantName } = useTenant();
  const features = [
    {
      icon: BookOpen,
      label: 'Cours interactifs',
    },
    {
      icon: Users,
      label: 'Communauté active',
    },
    {
      icon: Sparkles,
      label: 'Suivi intelligent',
    },
  ];

  return (
    <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gray-200/50 p-10 text-black">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-primary) text-white backdrop-blur">
          <GraduationCap className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold">{tenantName ?? 'LearneO'}</h2>
          <p className="text-sm text-gray/70">Smart Learning Platform</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        <div>
          <h1 className="text-5xl font-bold leading-tight ">
            Apprenez, Enseignez, Progressez
            <span className="text-(--color-primary)">.</span>
          </h1>

          <p className="mt-5 max-w-md text-sm text-gray/80">
            Une plateforme LMS moderne pour gérer vos cours, formations, certifications et
            communautés d'apprentissage.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="
                                    group
                                    rounded-2xl
                                    border
                                    border-border/50
                                    bg-card/60
                                    p-5
                                    backdrop-blur-sm
                                    transition-all
                                    duration-200
                                    hover:-translate-y-1
                                    hover:border-primary/30
                                    hover:shadow-lg
                                  "
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <p className="text-sm font-semibold">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="relative z-10 text-sm font-semibold text-black">© 2026 LearneO</p>
    </aside>
  );
}
