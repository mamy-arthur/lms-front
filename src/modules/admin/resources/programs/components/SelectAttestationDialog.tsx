"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Search } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttestationItem = {
    id: string;
    name: string;
    description?: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ATTESTATIONS: AttestationItem[] = [
    {
        id: "at1",
        name: "Développeur Web Full-Stack",
        description: "Compétences en développement front-end et back-end",
    },
    {
        id: "at2",
        name: "Ingénieur DevOps",
        description: "Maîtrise des pratiques DevOps, CI/CD et conteneurisation",
    },
    {
        id: "at3",
        name: "Chef de Projet Digital",
        description: "Gestion de projets numériques et animation d'équipes agiles",
    },
    {
        id: "at4",
        name: "Expert React",
        description: "Maîtrise avancée de l'écosystème React et Next.js",
    },
    {
        id: "at5",
        name: "Data Analyst",
        description: "Analyse de données, visualisation et reporting",
    },
    {
        id: "at6",
        name: "Cybersécurité Web",
        description: "Protection des applications web selon les standards OWASP",
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (attestation: AttestationItem) => void;
};

export function SelectAttestationDialog({
    open,
    onOpenChange,
    onSelect,
}: Props) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(
        () =>
            MOCK_ATTESTATIONS.filter((a) =>
                a.name.toLowerCase().includes(search.toLowerCase()),
            ),
        [search],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Sélectionner une attestation</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une attestation…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pr-1">
                        {filtered.map((att) => (
                            <button
                                key={att.id}
                                type="button"
                                onClick={() => {
                                    onSelect(att);
                                    onOpenChange(false);
                                }}
                                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-emerald-400/60 hover:bg-emerald-50/50"
                            >
                                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                                <div>
                                    <p className="text-xs font-semibold">
                                        {att.name}
                                    </p>
                                    {att.description && (
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            {att.description}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="py-8 text-center text-xs text-muted-foreground">
                                Aucune attestation ne correspond à votre
                                recherche.
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
