import { Users, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const kpis = [
    {
        label: "Parcours",
        value: "4",
        icon: Users,
    },
    {
        label: "Portefeuille",
        value: "400.000 €",
        icon: BarChart2,
        highlight: true,
    },
];

export function KpiCards() {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

                            <div className="mt-auto ml-auto flex flex-col lg:flex-row w-full justify-between  gap-4">
                                <p
                                    className={`text-xl md:text-2xl font-semibold tracking-tight ${
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
