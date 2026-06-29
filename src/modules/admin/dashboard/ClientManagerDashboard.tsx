"use client";

import { ChartLineDots } from "@/modules/shared/components/dashboard/chart/ChartBar";
import { KpiCards } from "@/modules/shared/components/dashboard/KpiCards";
import TopClientsCard from "@/modules/shared/components/dashboard/top-client/TopClientsCard";
import TopCoursesCard from "@/modules/shared/components/dashboard/top-courses/TopCoursesCard";

export function ClientManagerDashboard() {
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
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-2 lg:grid-cols-2">
                        <KpiCards />
                        <ChartLineDots />
                    </div>

                    <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
                        <div className="xl:col-span-2">
                            <TopCoursesCard />
                        </div>

                        <div className="xl:col-span-1">
                            <TopClientsCard />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
