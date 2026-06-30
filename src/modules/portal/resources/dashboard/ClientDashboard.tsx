import { useEffect, useState } from "react";
import { KpiCards } from "./components/KpiCards";
import { StudentDrawer } from "./components/students-drawer";
import { StudentsTable } from "./components/students-table";
import { Student, STUDENTS } from "./lib/students-data";
import { ProgressCard } from "./components/chart/chart-radial-text";
import { OnlineStudentsCard } from "./components/ActiveStudents";

export default function ClientDashboard() {
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Student | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 700);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="bg-background flex flex-col">
            <div className="mx-auto w-full">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Tableau de bord
                        </h1>{" "}
                        <p className="mt-1 text-sm text-muted-foreground">
                            Suivez la progression de vos étudiants et la
                            consommation de votre forfait en un coup d'œil.
                        </p>
                    </div>
                </header>
                <div className="flex flex-col space-y-3">
                    <KpiCards />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <StudentsTable
                                students={STUDENTS}
                                loading={loading}
                                onSelect={(s) => {
                                    setSelected(s);
                                    setDrawerOpen(true);
                                }}
                            />
                        </div>
                        <div className="flex flex-col self-start gap-2">
                            <ProgressCard />
                            <OnlineStudentsCard />
                        </div>
                    </div>
                </div>
            </div>
            <StudentDrawer
                student={selected}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
            />
        </div>
    );
}
