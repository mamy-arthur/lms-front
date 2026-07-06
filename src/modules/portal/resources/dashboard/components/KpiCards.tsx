import { Wallet, BookOpen, CircleCheckBig, LoaderCircle, ListTodo } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const kpis = [
  {
    label: 'Solde disponible',
    description: 'Disponible pour les prochains achats',
    value: '3 000 pts',
    icon: Wallet,
    highlight: true,
    span: 'lg:col-span-2',
  },
  {
    label: 'Parcours',
    description: 'Nombre de parcours suivis',
    value: '4',
    icon: BookOpen,
    span: 'lg:col-span-1',
  },
  {
    label: 'Terminés',
    description: 'Modules terminés',
    value: '86',
    icon: CircleCheckBig,
    span: 'lg:col-span-1',
  },
  {
    label: 'En cours',
    description: 'Modules en cours',
    value: '23',
    icon: LoaderCircle,
    span: 'lg:col-span-1',
  },
  {
    label: 'À faire',
    description: 'Modules à réaliser',
    value: '11',
    icon: ListTodo,
    span: 'lg:col-span-1',
  },
];

export function KpiCards() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;

        return (
          <Card
            key={kpi.label}
            className={`${kpi.span} bg-card transition-all duration-200 ${
              kpi.highlight
                ? 'border-0 bg-linear-to-br from-(--color-primary) via-(--color-primary)/90 to-(--color-primary)/70 shadow-lg shadow-(--color-primary)/20'
                : ''
            }`}
          >
            <CardContent className="flex h-28 flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${
                      kpi.highlight ? 'text-white/80' : ''
                    }`}
                  >
                    {kpi.label}
                  </p>

                  {kpi.description && (
                    <p
                      className={`mt-1 text-xs ${
                        kpi.highlight ? 'text-white/70' : 'text-gray-500'
                      }`}
                    >
                      {kpi.description}
                    </p>
                  )}
                </div>

                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    kpi.highlight ? 'bg-white/15' : 'bg-muted'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${kpi.highlight ? 'text-white' : 'text-muted-foreground'}`}
                  />
                </div>
              </div>
              <p
                className={`text-3xl tracking-tight ${
                  kpi.highlight ? 'text-white font-semibold' : 'text-black'
                }`}
              >
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
