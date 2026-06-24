"use client";

import { ChartLineDots } from "@/modules/shared/components/dashboard/chart/ChartBar";
import { KpiCards } from "@/modules/shared/components/dashboard/KpiCards";
import TopClientsCard from "@/modules/shared/components/dashboard/TopClient";
import TopCoursesCard from "@/modules/shared/components/dashboard/TopFormations";

export default function DashboardPage() {
    return (
        <div className="bg-background flex flex-col">
            <div className="mx-auto w-full">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Tableau de bord
                        </h1>{" "}
                        <p className="mt-1 text-sm text-muted-foreground">
                            Vue d'ensemble des indicateurs clés et des activités
                            récentes de votre plateforme.
                        </p>
                    </div>
                </header>
                <div className="flex flex-col space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <KpiCards />
                        <div>
                            <ChartLineDots />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-stretch">
                        <div className="col-span-2 h-full">
                            <TopCoursesCard />
                        </div>
                        <div className="col-span-1 h-full">
                            <TopClientsCard />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
