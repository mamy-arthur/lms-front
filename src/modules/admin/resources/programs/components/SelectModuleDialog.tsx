"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuleItem = {
    id: string;
    name: string;
    category: string;
    description?: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MODULES: ModuleItem[] = [
    {
        id: "m1",
        name: "Introduction au JavaScript",
        category: "Développement",
        description: "Variables, fonctions, DOM, ES6+",
    },
    {
        id: "m2",
        name: "React Fondamentaux",
        category: "Développement",
        description: "Composants, hooks, props, état",
    },
    {
        id: "m3",
        name: "TypeScript Essentiel",
        category: "Développement",
        description: "Types, interfaces, génériques",
    },
    {
        id: "m4",
        name: "SQL & Bases de données",
        category: "Développement",
        description: "Requêtes SQL, modélisation, indexation",
    },
    {
        id: "m5",
        name: "Docker & Conteneurisation",
        category: "DevOps",
        description: "Images, conteneurs, docker-compose",
    },
    {
        id: "m6",
        name: "CI/CD avec GitHub Actions",
        category: "DevOps",
        description: "Pipelines, tests automatisés, déploiement",
    },
    {
        id: "m7",
        name: "Kubernetes Avancé",
        category: "DevOps",
        description: "Orchestration, déploiements, services",
    },
    {
        id: "m8",
        name: "Gestion de projet Agile",
        category: "Management",
        description: "Scrum, Kanban, sprints, rétrospectives",
    },
    {
        id: "m9",
        name: "Leadership & Management",
        category: "Management",
        description: "Animation d'équipe, délégation, motivation",
    },
    {
        id: "m10",
        name: "Communication professionnelle",
        category: "Soft Skills",
        description: "Rédaction, prise de parole, feedback",
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    usedModuleIds: string[];
    onSelect: (module: ModuleItem) => void;
};

export function SelectModuleDialog({
    open,
    onOpenChange,
    usedModuleIds,
    onSelect,
}: Props) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("Tous");

    const categories = useMemo(() => {
        const cats = Array.from(
            new Set(MOCK_MODULES.map((m) => m.category)),
        );
        return ["Tous", ...cats];
    }, []);

    const filtered = useMemo(
        () =>
            MOCK_MODULES.filter((m) => {
                const matchSearch = m.name
                    .toLowerCase()
                    .includes(search.toLowerCase());
                const matchCat =
                    activeCategory === "Tous" || m.category === activeCategory;
                return matchSearch && matchCat;
            }),
        [search, activeCategory],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Ajouter un module</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un module…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Category filter */}
                    <div className="flex flex-wrap gap-1.5">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                                    activeCategory === cat
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Module grid */}
                    <div className="grid max-h-[52vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                        {filtered.map((mod) => {
                            const isAdded = usedModuleIds.includes(mod.id);
                            return (
                                <button
                                    key={mod.id}
                                    type="button"
                                    disabled={isAdded}
                                    onClick={() => {
                                        onSelect(mod);
                                        onOpenChange(false);
                                    }}
                                    className={cn(
                                        "flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                                        isAdded
                                            ? "cursor-not-allowed border-border bg-muted/40 opacity-60"
                                            : "border-border bg-card hover:border-blue-300 hover:bg-blue-50/50",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <BookOpen className="size-3.5 shrink-0 text-blue-500" />
                                            <span className="truncate text-xs font-semibold">
                                                {mod.name}
                                            </span>
                                        </div>
                                        {isAdded && (
                                            <Badge
                                                variant="secondary"
                                                className="shrink-0 text-[10px]"
                                            >
                                                Déjà ajouté
                                            </Badge>
                                        )}
                                    </div>
                                    {mod.description && (
                                        <p className="text-[11px] leading-tight text-muted-foreground">
                                            {mod.description}
                                        </p>
                                    )}
                                    <Badge
                                        variant="outline"
                                        className="w-fit text-[10px]"
                                    >
                                        {mod.category}
                                    </Badge>
                                </button>
                            );
                        })}
                        {filtered.length === 0 && (
                            <p className="col-span-2 py-8 text-center text-xs text-muted-foreground">
                                Aucun module ne correspond à votre recherche.
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
