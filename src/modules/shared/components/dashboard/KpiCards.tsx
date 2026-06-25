import { Users, BarChart2, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const kpis = [
    {
        label: "Nombre de clients",
        value: "4",
        icon: Users,
        trend: "+2",
        trendUp: true,
        trendLabel: "ce mois",
    },
    {
        label: "Chiffre d'affaires",
        value: "400.000 €",
        icon: BarChart2,
        trend: "+12%",
        trendUp: true,
        trendLabel: "ce mois",
        highlight: true,
    },
    {
        label: "Encaissé",
        value: "250.000 €",
        icon: CheckCircle2,
        trend: "+8%",
        trendUp: true,
        trendLabel: "ce mois",
    },
    {
        label: "En attente",
        value: "150.000 €",
        icon: Clock,
        trend: "-5%",
        trendUp: false,
        trendLabel: "ce mois",
    },
];

export function KpiCards() {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            {kpis.map((kpi) => {
                const Icon = kpi.icon;
                const hl = kpi.highlight;

                return (
                    <Card
                        key={kpi.label}
                        className={`overflow-hidden border-0 ${
                            hl
                                ? "bg-linear-to-br from-(--color-primary) via-(--color-primary)/90 to-(--color-primary)/60 shadow-xl shadow-(--color-primary)/20 ring-1 ring-white/10"
                                : ""
                        }`}
                    >
                        <CardContent className="flex h-36 flex-col">
                            <div className="flex  justify-between">
                                <div>
                                    <p
                                        className={`text-xs font-semibold uppercase tracking-wide ${
                                            hl ? "text-white" : "text-black"
                                        }`}
                                    >
                                        {kpi.label}
                                    </p>
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10 shadow-2xl">
                                    <Icon
                                        className={`h-4 w-4 ${
                                            hl ? "text-white" : "text-black"
                                        }`}
                                    />
                                </div>
                            </div>

                            <div className="mt-auto ml-auto flex w-full items-center justify-between text-end">
                                <div className="mt-1 flex items-center gap-1">
                                    {kpi.trendUp ? (
                                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3 text-red-400" />
                                    )}

                                    <span
                                        className={`text-xs font-medium ${
                                            kpi.trendUp
                                                ? "text-emerald-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {kpi.trend}
                                    </span>

                                    <span
                                        className={`text-xs ${
                                            hl ? "text-white/80" : "text-black"
                                        }`}
                                    >
                                        {kpi.trendLabel}
                                    </span>
                                </div>

                                <p
                                    className={`text-2xl font-semibold tracking-tight ${
                                        hl
                                            ? "text-white"
                                            : "text-accent-foreground"
                                    }`}
                                >
                                    {kpi.value}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
